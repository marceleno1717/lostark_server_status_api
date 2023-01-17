"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const app = (0, express_1.default)();
const invalidRequest = { message: 'invalid request!' };
const regionsID = {
    naw: 0,
    nae: 1,
    euc: 2,
    euw: 3,
    sa: 4
};
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(yield getAllServers());
}));
app.get('/region/:region/:servername', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const region = regionsID[req.params.region];
    const serverName = req.params.servername;
    const serverStatus = yield getServerStatus(region, serverName);
    if (serverStatus.server == 'invalid')
        return res.status(404).send(invalidRequest);
    res.send(serverStatus);
}));
app.get('/region/:region', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const region = regionsID[req.params.region];
    if (region == undefined)
        return res.status(404).send(invalidRequest);
    const allServers = yield getAllServers();
    const serverStatus = allServers[region];
    res.send(serverStatus);
}));
//! Handle 404
app.use((req, res) => {
    res.status(404).send(invalidRequest);
});
//! App listned on port 1717
app.listen(1717, () => {
    console.log('Server started!');
});
function getServerStatus(regionID, serverName) {
    return __awaiter(this, void 0, void 0, function* () {
        const allServers = yield getAllServers();
        const region = allServers[regionID];
        let server = { server: 'invalid', status: 'invalid' };
        region.servers.forEach((v, i) => {
            if (serverName == v.server) {
                server = v;
            }
        });
        return server;
    });
}
function getAllServers() {
    return __awaiter(this, void 0, void 0, function* () {
        const regions = [];
        yield axios_1.default.get('https://www.playlostark.com/en-gb/support/server-status').then((res) => {
            const $ = cheerio.load(res.data);
            //! GET REGIONS IDS
            const tabDiv = $('.ags-ServerStatus-content-tabs-tabHeading-label');
            tabDiv.each((i, e) => {
                var _a;
                const regionName = (_a = $(e).html()) === null || _a === void 0 ? void 0 : _a.trim();
                regions.push({ region: regionName, servers: [] });
            });
            //! GET SERVERS NAMES + STATUS + THEIR REGION
            const serversDiv = $('.ags-ServerStatus-content-responses-response');
            serversDiv.each((regionID, e) => {
                const divChilds = $(e);
                divChilds.each((i, e) => {
                    const d = cheerio.load($(e).html());
                    const serverInfoDivs = d('.ags-ServerStatus-content-responses-response-server');
                    serverInfoDivs.each((i, e) => {
                        var _a, _b;
                        const divChilds = d(e).children();
                        const serverStatus = (_a = d(d(divChilds[0]).children()[0]).attr('class')) === null || _a === void 0 ? void 0 : _a.split('--')[1].toLowerCase();
                        const serverName = (_b = d(divChilds[1]).html()) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
                        regions[regionID].servers.push({ server: serverName, status: serverStatus });
                    });
                });
            });
        });
        return regions;
    });
}
