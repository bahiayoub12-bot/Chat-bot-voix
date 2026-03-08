exports.handler = async (event) => {
  try {
    const { message, history } = JSON.parse(event.body);
    
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
              content: "أنت مساعد ذكي اسمك جواد تتحدث العربية بطلاقة ردودك مختصرة وواضحة"
            },
            ...(history || []),
            { role: "user", content: message }
          ],
          max_tokens: 500
        })
      }
    );

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
