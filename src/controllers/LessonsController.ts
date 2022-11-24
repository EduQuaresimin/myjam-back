import { Request, Response } from 'express';
import constants from '../config/constants/constants';
import { ChordsRepository } from '../repositories/ChordsRepository';
import { LessonsRepository } from '../repositories/LessonsRepository';
import { QuestionsRepository } from '../repositories/QuestionsRepository';
import { SongsChordsRepository } from '../repositories/SongsChordsRepository';
import { SongsRepository } from '../repositories/SongsRepository';
import { UsersLessonsRepository } from '../repositories/UsersLessonsRepository';
import { ChordsToModel } from '../services/helpers/ChordsToModel';
import { LessonsToModel } from '../services/helpers/LessonsToModel';
import { QuestionsToModel } from '../services/helpers/QuestionsToModel';
import { SongsToModel } from '../services/helpers/SongsToModel';

export class LessonsController {
    async create(req: Request, res: Response) {
        const { lessonName, lessonImageLink } = req.body;
        try {
            const newLesson = LessonsRepository.create({ lessonName, lessonImageLink });
            await LessonsRepository.save(newLesson);
            return res.status(201).json(LessonsToModel(newLesson));
        } catch (error) {
            console.log(error);
            return res.status(500).json(constants.CRUD.ERROR);
        }
    }

    async list(req: Request, res: Response) {
        try {
            const lessons = await LessonsRepository.find();
            const listLessons = lessons.map(LessonsToModel)
            res.status(200).json(listLessons);
        } catch (error) {
            console.log(error);
            return res.status(500).json(constants.CRUD.ERROR);
        }
    }

    async listOne(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const lesson = await LessonsRepository.findOneBy({ id: Number(id) });
            if (!lesson) {
                return res.status(404).json(constants.CRUD.LESSONS.NOT_FOUND);
            } else {
                res.status(200).json(LessonsToModel(lesson));
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json(constants.CRUD.ERROR);
        }
    }

    async update(req: Request, res: Response) {
        const { lessonName, lessonImageLink } = req.body;
        const { id } = req.params;
        try {
            const lesson = await LessonsRepository.findOneBy({ id: Number(id) });
            if (!lesson) {
                return res.status(404).json(constants.CRUD.LESSONS.NOT_FOUND);
            } else {
                await LessonsRepository.update(id, {
                    lessonName,
                    lessonImageLink
                });
                res.status(200).json(constants.CRUD.LESSONS.UPDATE);
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json(constants.CRUD.ERROR);
        }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const lessons = await LessonsRepository.delete({ id: Number(id) });
            res.status(204).json();
        } catch (error) {
            console.log(error);
            return res.status(500).json(constants.CRUD.ERROR);
        }
    }

    async listWithQuestions(req: Request, res: Response) {
        const { id } = req.params;
        const info = req.body.info;
        try {
            const lesson = await LessonsRepository.findOneBy({ id: Number(id) });
            if (!lesson) {
                return res.status(404).json(constants.CRUD.LESSONS.NOT_FOUND);
            }
            const relacion = await UsersLessonsRepository.findOneBy({
                usersId: Number(info.id),
                lessonsId: Number(lesson?.id)
            })
            if (!relacion) {
                await UsersLessonsRepository.create({
                    usersId: info.id,
                    lessonsId: lesson.id,
                    completedAt: null,
                    points: 100
                })
            }
            const questions = await QuestionsRepository.find({
                where: {
                    lessonsId: Number(id)
                }
            })
            if (!questions) {
                res.status(404).send(constants.CRUD.LESSONS.QUESTIONS.NOT_FOUND)
            }

            const listQuestions = questions.map(QuestionsToModel)

            let questionOfMusic = [];
            let lessonContent;

            for (let index = 0; index < questions.length; index++) {
                const element = questions[index];
                if (element.isExplanation === 0) {
                    const song = await SongsRepository.findOneBy({
                        id: Number(element.songsId)
                    })
                    if (!song) {
                        res.status(404).send(constants.CRUD.SONGS.NOT_FOUND)
                    }
                    const songsChords = await SongsChordsRepository.findBy({ songsId: Number(song?.id) })
                    for (let count = 0; count < songsChords.length; count++) {
                        const element = songsChords[count];
                        const chords = await ChordsRepository.findOneBy({ id: Number(element.chordsId) })
                        if (chords) {
                            questionOfMusic[count] = ChordsToModel(chords!)
                        }
                    }
                    if (element.questionTemplate === 'lesson_chord') {
                        lessonContent = {
                            Lesson: LessonsToModel(lesson),
                            Questions: listQuestions,
                            Chords: questionOfMusic
                        }
                    } else if (element.questionTemplate === 'lesson_song') {
                        lessonContent = {
                            Lesson: LessonsToModel(lesson),
                            Questions: listQuestions,
                            Song: SongsToModel(song!),
                            Chords: questionOfMusic
                        }
                    }
                } else {
                    lessonContent = {
                        Lesson: LessonsToModel(lesson),
                        Questions: listQuestions
                    }
                }
            }
            res.status(200).send(lessonContent)
        } catch (error) {
            console.log(error);
            return res.status(500).json(constants.CRUD.ERROR);
        }
    }
}