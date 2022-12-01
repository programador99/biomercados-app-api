import mongoose from "mongoose";

const FrequentQuestionsSchema = new mongoose.Schema({
    title: String,
    content: String
});

export default mongoose.model('FrequentQuestions', FrequentQuestionsSchema);