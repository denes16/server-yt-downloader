const router = require('express').Router();
const ytdl = require('ytdl-core');
router.get('/', (req, res) => {
    res.json({ s: true });
});

router.get('/info', (req, res) => {
    const url = req.query.url;
    if (!url) {
    }
    ytdl.getInfo(url)
        .then((d) => {
            res.json({ d });
        })
        .catch((e) => {
            res.json({ e });
        });
});
router.post('/download', async (req, res) => {
    let { url, quality } = req.body;
    quality = 19;
    let video = true;
    if (req.body.audio) {
        video = false;
        console.log('hey');
    }
    res.header('Content-Disposition', 'attachment; filename="video.mp4"');
    try {
        const data = await ytdl.getInfo(url);
        // Validate quiality itag
        if (
            !data.player_response.streamingData.formats.find(
                (v) => v.itag === quality,
            )
        ) {
            // res.json({ d: 'Invalid quiality' });
            throw new Error('Invalid quality');
        }
        // ytdl(url, {
        //     format: 'mp4',
        //     quality,
        // }).pipe(res);
    } catch (error) {
        if(error.name === 'Error') {
            res.status(500).json({ d: 'd' });
        }
        console.log('d', {n: error.name, m: error.message});
    }
});
module.exports = router;
