const jwt = require('jsonwebtoken');

var source_token = require('../server');


// ===================
// Verificar token
// ===================

let verificaToken = ( req, res, next) => {

    var token_back = source_token.tokenvar;
    let token_req = req.get('token'); // Authorization
    console.log("Token req: "+token_req);
    console.log("Token back: "+token_back);


    if( token_req ){

        /*res.json({
            token: token
        });*/

        jwt.verify(token_req, 'el-seed-desarrollo', (err, decode) => {

            if( err ){
                return res.status(401).json({
                    ok: false,
                    err
                });
            } else{

                var current_time = new Date().getTime() / 1000;
                console.log("Current time: "+current_time);
                console.log("Token time: "+decode.exp);
                
                
                if (current_time > decode.exp){
                    return res.status(401).json({
                        ok: false,
                        message: "El token caducó"
                    });
                }else{
                    console.log("Token valido");
                    //req.codigos = decode.codigos;
                    //console.log(req.codigos);
                    //req.name = decode.name;
                    //console.log(req.name);
                    next();         
                }
        
        }


        })
    } else{
        return res.status(401).json({
            ok: false,
            message: "Necesita contar con un token"
        });
    }
        
    

};

module.exports = {
    verificaToken
}