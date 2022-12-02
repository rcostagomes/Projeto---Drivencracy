import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs"

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("Drivencracy");
});

const enqueteSchema = joi.object({
  title: joi.string().min(1).required(),
  expireAt: joi.string(),
});

app.post("/poll", async (req, res) => {
  const { title, expireAt } = req.body;
  const days = expireAt;
  const enquete = {
    title,
    expireAt,
  };
  const validacao = enqueteSchema.validate(enquete, { abortEarly: false });
  if (validacao.error) {
    const error = validacao.error.details.map((d) => d.message);
    res.status(422).send(error);
    return;
  }
  if (expireAt === null || undefined ){
    days = dayjs().add(30, "d").format("YYYY-MM-DD HH:mm")
  }
  try {
    await db.collection("polls").insertOne({
      title: title,
      expireAt: days
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Falha na conexão com servidor");
  }

  res.status(201).send("Enquete Criada");
});

app.get("/poll", async (req, res) => {
    try{
        const enquetes = await db.collection("polls").find({}).toArray();
        res.status(200).send(enquetes)
    }catch(err){console.log(err)}
});

app.listen(5000, () => console.log("App runing in port:5000"));
