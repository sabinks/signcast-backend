import express from 'express'
import { Screen, validateScreen } from '../model/screen.js';

const router = express.Router()
router.get('', async (req, res) => {
    const screens = await Screen.find({})
    res.send(screens)
});
router.post('', async (req, res) => {
    const { error } = validateScreen(req.body)
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const screen = Screen({
        screenId: req.body.screenId,
        name: req.body.name,
        content: req.body.content,
        width: req.body.width,
        height: req.body.height
    })
    await screen.save();
    res.send({ message: 'Screen added successfully' })
});
router.put('/:id', async (req, res) => {
    const { error } = validateScreen(req.body)
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const screen = await Screen.findOne({ _id: req.params.id });
    screen.screenId = req.body.screenId;
    screen.name = req.body.name;
    screen.content = req.body.content;
    screen.width = req.body.width;
    screen.height = req.body.height
    await screen.save();
    res.send({ message: 'Screen updated successfully' })
});
router.delete('/:id', async (req, res) => {
    await Screen.deleteOne({ _id: req.params.id });
    res.send({ message: 'Screen deleted successfully' })
});

export default router;