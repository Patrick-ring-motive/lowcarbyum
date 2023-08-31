import {fileFromRequest} from './static-files.mjs';
import {normalizeRequest,mapResDTO,applyResponse} from './modules/http-fetch.mjs';
import {addCorsHeaders} from './modules/cors-headers.mjs';
import fetch from 'node-fetch';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let hostTarget = 'lowcarbyum.com';
let hostList = [];
hostList.push(hostTarget);

export async function serverRequestResponse(reqDTO){
  
  let resDTO={};
  resDTO.headers={};
  let hostProxy = reqDTO.host;
  let path = reqDTO.shortURL.replaceAll('*', '');
  let pat = path.split('?')[0].split('#')[0];

  if (reqDTO.shortURL == '/ping') {
    resDTO.statusCode = 200;
    return resDTO;
  }
  if ((pat == '/link-resolver.js') ||(pat == '/hide.css')){

    return fileFromRequest(pat);

  }



  reqDTO.host = hostTarget;
  reqDTO.headers.host = hostTarget;
  reqDTO.headers.referer = hostTarget;


  let response;
  let ct;
 
  let backoff=1;
  let paramChar = path.includes('?') ? '&' : '?';
  let salt = paramChar+'á';
  let tryDTO=reqDTO;
  
  for(let i=0;i<5;i++){
    backoff*=2;
    await sleep(backoff);
  try{
    if(i==3){tryDTO=undefined;}
  response = await fetch('https://' + hostTarget + path + salt, tryDTO);
    salt =paramChar+new Date().getTime();
  ct = response.headers.get('content-type');

  if((ct!==undefined)&&(ct === null)) {
 //  console.log('retry: '+path+salt); 

  }else{
    break;
  }

  }catch(e){
     salt ='?'+new Date().getTime();
    console.log(e.message);
    continue;
  }
  }
  

     
    if (((ct) && (!ct.includes('image')) && (!ct.includes('video')) && (!ct.includes('audio')))) {
//console.log(ct);
      /* Copy over target response and return */
      let resBody = await response.text();
//console.log(resBody.split('body')[0]);
      resBody = resBody.replace(`</head>`,
        `<script src="https://files-servleteer.vercel.app/lovefromtheoven/link-resolver.js" host-list=` + btoa(JSON.stringify(hostList)) + `></script>
        <link rel="stylesheet" href="`+`https://files-servleteer.vercel.app/lowcarbyum/hide.css`+`"></link></head>`);
    
      
      resDTO.body = resBody;
      return resDTO;


    } else {

      resDTO.body=Buffer.from(await response?.arrayBuffer?.());
      return resDTO;

    }
  


}