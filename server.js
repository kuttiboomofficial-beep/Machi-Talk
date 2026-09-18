import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "64kb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const allowed = new Set(["Tamil","Hindi","English","Telugu","Bengali"]);

app.get("/health", (_req,res)=>res.json({ok:true, service:"MACHI TALK V2"}));

app.post("/translate", async (req,res)=>{
  try{
    const { text, source, target } = req.body || {};
    if(!text || !source || !target) return res.status(400).json({error:"text, source and target are required"});
    if(!allowed.has(source) || !allowed.has(target)) return res.status(400).json({error:"Unsupported language"});
    if(source === target) return res.json({translation:text});

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions:
        `You are a professional live interpreter. Translate from ${source} to ${target}. ` +
        `Return ONLY the translated sentence. Preserve names, numbers, order details, prices and units. ` +
        `Do not add explanations or quotation marks.`,
      input: text
    });

    res.json({translation: response.output_text.trim()});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Translation service error"});
  }
});

const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`MACHI TALK V2 server running on ${port}`));
