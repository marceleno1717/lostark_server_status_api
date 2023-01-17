import express, { Router } from 'express'
import axios, { all } from 'axios'
import * as cheerio from 'cheerio'

const app = express()

const invalidRequest = { message: 'invalid request!' }

const regionsID: any = {
    naw: 0,
    nae: 1,
    euc: 2,
    euw: 3,
    sa: 4
}

app.get('/', async (req, res) => {
    res.send(await getAllServers())
})

app.get('/region/:region/:servername', async (req, res) => {
    const region = regionsID[req.params.region]
    const serverName = req.params.servername

    const serverStatus = await getServerStatus(region, serverName);

    if (serverStatus.server == 'invalid') return res.status(404).send(invalidRequest);

    res.send(serverStatus)
});

app.get('/region/:region', async (req, res) => {
    const region = regionsID[req.params.region]

    if (region == undefined) return res.status(404).send(invalidRequest);

    const allServers = await getAllServers();
    const serverStatus = allServers[region];

    res.send(serverStatus)
});


//! Handle 404
app.use((req, res) => {
    res.status(404).send(invalidRequest);
});

//! App listned on port 1717
app.listen(1717, () => {
    console.log('Server started!');
});

async function getServerStatus(regionID: number, serverName: string): Promise<Server> {
    const allServers = await getAllServers()
    const region = allServers[regionID]

    let server: Server = { server: 'invalid', status: 'invalid' }

    region.servers.forEach((v, i) => {
        if (serverName == v.server) {
            server = v;
        }
    });

    return server
}

async function getAllServers(): Promise<Region[]> {
    const regions: Region[] = []
    await axios.get('https://www.playlostark.com/en-gb/support/server-status').then((res) => {
        const $ = cheerio.load(res.data);
        //! GET REGIONS IDS
        const tabDiv = $('.ags-ServerStatus-content-tabs-tabHeading-label');
        tabDiv.each((i, e) => {
            const regionName = $(e).html()?.trim()
            regions.push({ region: regionName, servers: [] });
        });
        //! GET SERVERS NAMES + STATUS + THEIR REGION

        const serversDiv = $('.ags-ServerStatus-content-responses-response');

        serversDiv.each((regionID, e) => {
            const divChilds = $(e)

            divChilds.each((i, e) => {
                const d = cheerio.load($(e).html()!)

                const serverInfoDivs = d('.ags-ServerStatus-content-responses-response-server')

                serverInfoDivs.each((i, e) => {
                    const divChilds = d(e).children()

                    const serverStatus = d(d(divChilds[0]).children()[0]).attr('class')?.split('--')[1].toLowerCase()
                    const serverName = d(divChilds[1]).html()?.trim().toLowerCase()

                    regions[regionID].servers.push({ server: serverName, status: serverStatus })
                });
            });
        });
    });

    return regions;
}