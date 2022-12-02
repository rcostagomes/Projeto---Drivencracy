import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("Drivencracy");
});

const pollSchema = joi.object({
  title: joi.string().min(1).required(),
  expireAt: joi.string(),
});

const choiceSchema = joi.object({
  title: joi.string().min(1).required(),
  pollId: joi.string(),
});

app.post("/poll", async (req, res) => {
  const { title, expireAt } = req.body;
  const days = expireAt;
  const enquete = {
    title,
    expireAt,
  };
  const validacao = pollSchema.validate(enquete, { abortEarly: false });
  if (validacao.error) {
    const error = validacao.error.details.map((d) => d.message);
    res.status(422).send(error);
    return;
  }
  if (expireAt === null || undefined) {
    days = dayjs().add(30, "d").format("YYYY-MM-DD HH:mm");
  }
  try {
    await db.collection("polls").insertOne({
      title: title,
      expireAt: days,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Falha na conexão com servidor");
  }

  res.status(201).send("Enquete Criada");
});

app.get("/poll", async (req, res) => {
  try {
    const enquetes = await db.collection("polls").find({}).toArray();
    res.status(200).send(enquetes);
  } catch (err) {
    console.log(err);
  }
});

app.post("/choice", async (req, res) => {
  const { title, pollId } = req.body;
  const choice = {
    title,
    pollId,
  };
  const validacao = choiceSchema.validate(choice, { abortEarly: false });
  if (validacao.error) {
    const error = validacao.error.details.map((d) => d.message);
    res.status(422).send(error);
    return;
  }
  try {
    const idExist = await db.collection("polls").findOne(ObjectId(pollId));
    if (!idExist) {
      res.send(404);
      return;
    }
    const choiceExist = await db.collection("choices").findOne(choice);
    if (choiceExist) {
      res.sendStatus(409);
    }
    await db.collection("choices").insertOne(choice);
    res.status(201).send(choice);
  } catch (err) {
    console.log(err);
  }
});

app.get("/poll/:id/choice", async (req, res) => {
  const { id } = req.params;
  console.log(id);

  try {
    const pollExist = await db
      .collection("polls")
      .findOne({ _id: ObjectId(id) });
    if (!pollExist) {
      res.sendStatus(404);
      return;
    }
    const choices = await db
      .collection("choices")
      .find({ pollId: id })
      .toArray();
    console.log(choices);

    res.status(200).send(choices);
  } catch (err) {
    console.log(err);
  }
});

app.listen(5000, () => console.log("App runing in port:5000"));
