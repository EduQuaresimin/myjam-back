import { Request, Response } from "express";
import { UsersRepository } from "../repositories/UsersRepository";
import { UsersQuestionsRepository } from "../repositories/UsersQuestionsRepository";
import bcrypt from 'bcryptjs';
import * as jtw from 'jsonwebtoken';
import { secretKey } from "../config/secret/secret";
import constants from "../config/constants/constants";
import mail from "../services/mail/mail";

export class RegisterController {
    async register(request: Request, response: Response) {
        request.body.password = bcrypt.hashSync(request.body.password, 10);
        const { userName, email, password } = request.body;
        try {
            let newUser = UsersRepository.create({ userName, email, password });
            await UsersRepository.save(newUser);
            const token = jtw.sign({
                id: newUser.id
            }, secretKey, {
                expiresIn: '1 day'
            });
            newUser.password = 'Secret'
            response.status(201).send({
                RegisteredUser: newUser,
                Token: token
            })
        } catch (error) {
            console.log(error)
            return response.status(500).send(constants.CRUD.ERROR)
        }
    }

    async question(request: Request, response: Response) {
        const { instrumentId, experienceId, practiceId, styleId, learnId } = request.body;
        const usersId = request.body.info.id;
        try {
            const newUserQuestion = UsersQuestionsRepository.create({ instrumentId, experienceId, practiceId, styleId, learnId, usersId })
            await UsersQuestionsRepository.save(newUserQuestion);
            response.status(201).send({
                RegisteredQuestions: newUserQuestion
            })
        } catch (error) {
            console.log(error)
            return response.status(500).send(constants.CRUD.ERROR)
        }
    }
}