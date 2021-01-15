const router = require('express').Router();
const ytdl = require('ytdl-core');
router.get('/', (req, res) => {
    res.json({ s: true });
});

router.get('/info', async (req, res) => {
    const url = req.query.url;
    try {
        data = await ytdl.getInfo(url);
        const {
            player_response: {
                videoDetails: {
                    title,
                    author,
                    thumbnail: { thumbnails },
                },
            },
        } = data;
        const thumbnail = thumbnails[0];
        const videoFormats = data.formats
            .filter((v) => v.container === 'mp4' && v.hasAudio && v.hasVideo)
            .map((v) => {
                v.format = 'mp4';
                return v;
            });
        const audioFormats = [];
        audioFormats.push({
            ...ytdl.chooseFormat(data.formats, { quality: 'highestaudio' }),
            qualityLabel: 'Alta',
        });
        audioFormats.push({
            ...ytdl.chooseFormat(data.formats, { quality: 'lowestaudio' }),
            qualityLabel: 'Baja',
        });
        audioFormats.forEach((v) => (v.format = 'mp3'));
        const finalFormats = audioFormats.concat(videoFormats).map((v) => {
            return {
                itag: v.itag,
                quality: v.qualityLabel,
                size: Number(v.contentLength),
                format: v.format,
                url: v.url,
            };
        });
        res.json({
            status: true,
            data: {
                title,
                author,
                thumbnail,
                formats: finalFormats,
            },
        });
    } catch (error) {
        let msg = 'Ha ocurrido un error';
        let status = 400;
        switch (error.message) {
            case 'Video unavailable':
                msg = 'Video no encontrado';
                break;
            case 'Not a YouTube domain':
                msg = 'Url inválida';
                break;
            default:
                status = 500;
                break;
        }
        console.log(error.message);
        res.status(status).json({ success: false, error: { msg } });
    }
});
router.get('/download/:quality', async (req, res) => {
    let { quality } = req.params;
    const { url, audio } = req.query;
    let video = true;
    if (audio) {
        video = false;
    }
    try {
        const data = await ytdl.getInfo(url);
        const formats = data.formats;
        // VALIDATIONS
        // Validate quiality itag
        if (!formats.find((v) => v.itag == quality)) {
            // res.json({ d: 'Invalid quiality' });
            throw new Error('Invalid quality');
        }
        // DOWNLOAD
        const formatElegido = ytdl.chooseFormat(data.formats, {
            quality,
        });
        const fileSize = formatElegido.contentLength;
        if (fileSize) {
            res.header('content-length', fileSize);
        }
        let name = data.player_response.videoDetails.title
            .toLocaleLowerCase()
            .replace(/\s/g, '-');
        name = name.replace(
            /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
            ''
        );
        if (!video) {
            res.header(
                'Content-Disposition',
                `attachment; filename="${name}.mp3"`
            );
        } else {
            res.header(
                'Content-Disposition',
                `attachment; filename="${name}.mp4"`
            );
        }
        ytdl.downloadFromInfo(data, {
            format: formatElegido,
        }).pipe(res);
    } catch (error) {
        if (error.name === 'Error') {
            return res
                .status(400)
                .json({ success: false, error: { msg: error.message } });
        }
        console.log('error 500', { n: error.name, m: error.message });
        return res
            .status(500)
            .json({ success: false, error: { msg: 'Ha ocurrido un error' } });
    }
});
module.exports = router;
