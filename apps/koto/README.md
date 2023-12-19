<p align="center">
  <a href="https://discord.gg/UttZbEd9zn" target="blank"><img src="https://raw.githubusercontent.com/jurienhamaker/Koto/main/koto%20sticker.png" width="200" alt="Muse logo" /></a>
</p>

  <p align="center">A wordle on <a href="http://discord.com" target="_blank">Discord</a> bot.</p>
    <p align="center">
      <img src="https://img.shields.io/github/license/jurrienhamaker/koto" alt="Package License" />
      <img src="https://img.shields.io/github/actions/workflow/status/jurienhamaker/koto/koto.yml" alt="CircleCI" />
      <a href="https://discord.gg/UttZbEd9zn" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
    </p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Running Koto

### Getting started

```bash
$ git clone git@github.com:jurienhamaker/koto.git
```

**Copy the `.env.example` to `.env` and change the values in the `.env` file**
**Copy the `koto.env.example` to `koto.env` and change the values in the `koto.env` file**

---

### Docker (Recommended)

#### Prerequisite

-   [Docker](https://www.docker.com/)

### Running the app

```bash
$ docker-compose up -d db
$ docker-compose up koto
```

### Running migrations

```bash
$ docker-compose exec -it koto yarn nx run prisma-koto:migrate-dev
```

---

### NodeJS

#### Prerequisite

-   [NodeJS 18.x](https://nodejs.org/en/download)
-   [PostgresDB](https://www.postgresql.org/)

#### Installing

```bash
$ yarn
$ yarn nx run prisma-koto:generate-client
$ yarn nx run prisma-koto:migrate-dev
```

### Running the bot/api

```bash
# watch mode (recommended)
$ yarn koto:start

# production mode
$ yarn koto:start:prod
```

---

## Stay in touch

-   Author - [Jurien Hamaker](https://jurien.dev)
-   Website - [jurien.dev](https://jurien.dev/)
-   Ko-Fi - [ko-fi.com/jurienhamaker](https://ko-fi.com/jurienhamaker)

## License

YUGEN is [GPL licensed](LICENSE).
