import express from "express";
import { PrismaClient } from "./generated/prisma/index.js";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ---- METHOD GET ----

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

// ------- METHOD POST -------

app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } =
        req.body;

    try {
        //duplicated movie title verification
        const duplicateMovie = await prisma.movie.findFirst({
            where: {
                title: { equals: title, mode: "insensitive" },
            },
        });

        if (duplicateMovie) {
            return res.status(409).send({
                message: "This movie title has been registered already",
            });
        }

        await prisma.movie.create({
            data: {
                //the values can be ommitted when they are the same
                title: title,
                genre_id: genre_id,
                language_id: language_id,
                oscar_count: oscar_count,
                release_date: new Date(release_date),
            },
        });
    } catch (error) {
        return res.status(500).send({ message: "Fail to register movie" });
    }

    res.status(201).send();
});

//------METHOD PUT ------- updating data

app.put("/movies/:id", async (req, res) => {
    // get register's id to be updated
    const id = Number(req.params.id);

    try {
        // checking if movie id exist and messaging client
        const movie = await prisma.movie.findUnique({
            where: { id },
        });

        if (!movie) {
            return res.status(404).send({ message: "Movie does not exist" });
        }

        // get data object from body
        const data = { ...req.body }; //spread to get anything from body
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;

        // get movie data to be updated and update it on prisma
        await prisma.movie.update({
            where: { id: id },
            data: data,
        });
    } catch (error) {
        return res.status(500).send({ message: "Fail to update record" });
    }

    // return status of update
    res.status(200).send();
});

// ------ METHOD DELETE ------ remove a movie
app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: { id },
        });

        if (!movie) {
            return res.status(404).send({ message: "Movie does not exist" });
        }

        await prisma.movie.delete({ where: { id } });
    } catch (error) {
        return res.status(500).send({ message: "Fail to remove record" });
    }

    res.status(200).send();
});

// ------- METHOD GET ----- FILTER MOVIES BY GENRE -----
app.get("/movies/:genreName", async (req, res) => {
    // get genre name params

    try {
        // filter movies database by genre
        const filteredByGenre = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true,
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: "insensitive",
                    },
                },
            },
        });

        // return filtered movies
        res.status(200).send(filteredByGenre);

    } catch (error) {
        res.status(500).send({ message: "Fail to filter genre" });
    }
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
