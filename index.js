const axios = require('axios');
const fs = require('fs');
//load json from ./json/id.json
let rawdata = fs.readFileSync('./json/id.json');
let id = JSON.parse(rawdata);
let cookies = 'userId='+id.userId+'; serviceToken='+id.serviceToken+';'

var dirname = "./notes"
if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname);
}

let config = {
    method: 'get',
    maxBodyLength: Infinity,
    headers: { 
      'accept': '*/*', 
      'accept-language': 'fr;q=0.7', 
      'cache-control': 'no-cache', 
      'cookie':cookies,
      'dnt': '1', 
      'pragma': 'no-cache', 
      'priority': 'u=1, i', 
      'referer': 'https://eu.i.mi.com/note/h5', 
      'sec-ch-ua': '"Not)A;Brand";v="99", "Brave";v="127", "Chromium";v="127"', 
      'sec-ch-ua-mobile': '?0', 
      'sec-ch-ua-platform': '"Windows"', 
      'sec-fetch-dest': 'empty', 
      'sec-fetch-mode': 'cors', 
      'sec-fetch-site': 'same-origin', 
      'sec-gpc': '1', 
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    }
  };

let idList = [];

function loadList(syncTag){
    config.url = 'https://eu.i.mi.com/note/full/page/?limit=200'+(syncTag ? '&syncTag='+syncTag : '');
    axios.request(config)
    .then((response) => {
        data = response.data.data.entries;
        idList = idList.concat(data);
        if(!response.data.data.lastPage){
            loadList(response.data.data.syncTag);
        }else{
            fs.writeFile(dirname+'/id.json', JSON.stringify(idList), function (err) {
                if (err) throw err;
                console.log('Saved id list!');
            });
            idList.forEach((note) =>{
                console.log(note.id);
                loadNote(note.id);
            })
        }
    })
    .catch((error) => {
        console.log(error);
    });
}

function loadNote(id){
    config.url= 'https://eu.i.mi.com/note/note/'+id+'/'
    axios.request(config)
    .then((response) => {
        let note = response.data.data.entry.content;
        let date = new Date(response.data.data.entry.createDate);
        let title = JSON.parse(response.data.data.entry.extraInfo).title;
        let text = title + "\n\n" +convertToText(note);
        fs.writeFile(dirname+'/'+date.getDate()+'-'+(date.getMonth()+1)+'-'+date.getFullYear()+'_'+date.getHours()+'-'+date.getMinutes()+'.txt', text, function (err) {
            if (err) throw err;
            console.log('Saved '+id+'!');
        });
    })
    .catch((error) => {
        console.log(error);
    });
}

loadList()

function convertToText(data) {
    return data
        .replace(/<\/?text[^>]*>/g, '') 
        .trim();
}
