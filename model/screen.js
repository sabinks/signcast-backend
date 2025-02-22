import { Schema, model } from "mongoose";
import Joi from 'joi'

const screenSchema = new Schema({
    screenId: { type: String, required: true },
    name: { type: String, required: true },
    content: { type: Object, required: true },
    width: { type: Number },
    height: { type: Number }
}, {
    timestamps: true
})

function validateScreen(data) {
    const schema = Joi.object({
        screenId: Joi.string().required(),
        name: Joi.string().required(),
        content: Joi.object().required(),
        width: Joi.number(),
        height: Joi.number()
    })
    return schema.validate(data, { abortEarly: false })
}

const Screen = model('Screen', screenSchema)
export { Screen, screenSchema, validateScreen }