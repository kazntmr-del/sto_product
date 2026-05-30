// ============================================================
//  Cloudflare Worker — прокси для отправки заявок в Salebot
//  Прячет API-ключ и решает проблему CORS.
//  Скопируйте ВЕСЬ этот код в редактор воркера на dash.cloudflare.com
// ============================================================

// Ваш ключ Salebot (он остаётся ТОЛЬКО здесь, на сервере — на сайте его нет)
const SALEBOT_API_KEY = "b34df430ed9b131a8649c4a5560f5154";

// (необязательно) id состояния воронки, куда класть сделку. Оставьте null если не нужно.
const SALEBOT_STATE_ID = null;

export default {
  async fetch(request) {
    // --- Заголовки CORS: разрешаем запросы с вашего сайта ---
    const cors = {
      "Access-Control-Allow-Origin": "*",            // можно заменить * на ваш домен
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Предварительный запрос браузера (preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }

    try {
      const data = await request.json();

      // Собираем тело запроса к Salebot
      const payload = {
        name: data.name || "Заявка с сайта",
        description: data.description || "",
      };
      if (data.phone) payload.phone = data.phone;
      if (data.email) payload.email = data.email;
      if (data.client_id) payload.client_id = data.client_id;
      if (SALEBOT_STATE_ID) payload.state_id = SALEBOT_STATE_ID;

      // Запрос к Salebot — выполняется на сервере, CORS здесь не действует
      const sbRes = await fetch(
        "https://chatter.salebot.pro/api/" + SALEBOT_API_KEY + "/create_order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const text = await sbRes.text();
      return new Response(text, {
        status: sbRes.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: String(err) }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
  },
};
