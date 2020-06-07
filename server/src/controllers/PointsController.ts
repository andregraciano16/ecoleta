import knex from '../database/connection';
import { Request, Response } from 'express';

class PointsController {

    async create(request: Request, response: Response) {

        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;


        const point = {
            image: request.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };
        const trx = await knex.transaction();

        const insertedIds = await trx('points').insert(point);

        const point_id = insertedIds[0];

        const pointItems = items.split(',')
            .map((item: string) => Number(item.trim()))
            .map((item_id: number) => {
                return {
                    point_id,
                    item_id,
                }
            })

        await trx('point_items').insert(pointItems);

        await trx.commit();

        return response.json({
            point_id,
            ...point,
        });
    }

    async  show(request: Request, response: Response) {
        const { id } = request.params;
        const point = await knex('points').where('id', id).first();
        if (!point) {
            return response.status(400).json({ meessage: 'Point not found' })
        }

        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.title');
        const serializedPoint = {
            ...point,
            image_url: `http://192.168.25.19:3333/uploads/${point.image}`
        }
        return response.json({ point: serializedPoint, items });
    }

    async index(request: Request, response: Response) {

        const { city, uf, items } = request.query;
        const parsedItems = items !== undefined ? String(items).split(',').map(item => Number(item.trim())) : [0]
        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');

        const serializedPoint = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.25.19:3333/uploads/${point.image}`
            }
        })
        return response.json(serializedPoint);
    }

}

export default PointsController;