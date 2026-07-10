import { NextFunction, Request, Response } from "express";
import { PostService } from "../services/PostServices";


export class PostController {

    // GET /posts
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const posts = await PostService.listAll();
            return res.json(posts);
        } catch (error) {
            next(error);
        }
    }

    // GET /posts/:id
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);

            const post = await PostService.getById(id);

            return res.json(post);
        } catch (error) {
            next(error);
        }
    }

    // POST /posts
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, userId } = req.body;

            const post = await PostService.create({
                title,
                userId
            });

            return res.status(201).json(post);
        } catch (error) {
            next(error);
        }
    }

    // PUT /posts/:id
    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const { title } = req.body;

            const post = await PostService.update(id, {
                title
            });

            return res.status(200).json(post);
        } catch (error) {
            next(error);
        }
    }

    // DELETE /posts/:id
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);

            await PostService.delete(id);

            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}