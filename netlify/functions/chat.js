export default async (request) => {
  const { message, history } = await request.json();
  
  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: "أنت مساعد ذكي اسمك جواد تتحدث العربية بطلاقة"
          },
          ...history,
          { role: "user", content: message }
        ]
      })
    }
  );

  const data = await response.json();
  return Response.json(data);
};

export const config = { path: "/api/chat" };
