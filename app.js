//Config
const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
let localStorage = require('node-localstorage').LocalStorage;
localStorage = new localStorage('./scratch');
const multer = require('multer');
const upload = multer({dest: './img'});



app.use(bodyParser.json());

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'task'
})

con.connect((err) => {
    if(err) throw err;
    console.log('Database Connected...')
})


//decode token function

function decodeToken(){
    let token = localStorage.getItem('token')
    return decoded = jwt.verify(token, 'HS256')

}


//register

app.get('/register', (req,res) => {
    res.send('Register');
})

app.post('/register',(req, res) => {
    let data = {name: req.body.name, email:req.body.email, password: req.body.password};
    let sql = "INSERT INTO users SET ?";
    con.query(sql, data,(err, results) => {
      if(err) throw err;
      const token = jwt.sign({
          name:req.body.name,
          email:req.body.email,
          password: req.body.password
      },'HS256',{
          expiresIn: '1h'
      });
      res.send(token);
    });
  });


  //login


  app.get('/login', (req,res) => {
    res.send('login');
})


app.post('/login',(req, res) => {
    let data = {email:req.body.email, password: req.body.password};
    let sql = "SELECT password FROM users WHERE email = " + "'" + data.email + "'" ;
    con.query(sql, (err, results) => {
      if(err) throw err;
      else if (results.length > 0 && data.password == results[0].password){
      const token = jwt.sign({
          name: req.body.name,
          email:req.body.email,
          password: req.body.password
      },'HS256',{
          expiresIn: '1h'
      });
      localStorage.setItem('token', token)
      res.send(token);
      
    }
    else{
        res.send('wrond password')
    }
    });
  });


  //Информация о текущем пользоветеле



  app.get('/me',(req,res)=>{
      let me ={name:decodeToken().name, email:decodeToken().email}
      res.status(200).json(me);
  })

  //Вывод товаров

  app.get('/items', (req,result)=>{
      let sql = 'SELECT * FROM goods';
      con.query(sql, (err,res) => {
          if(err) throw err
          result.status(200).json(res);

      })
  })


  //Создание товара

  app.post('/items', (req,res) => {
      let currentUser = {
        name:decodeToken().name,
        email: decodeToken().email
      }
      let data = { 
        product: req.body.product, 
        descrption: req.body.descrption,
        photolink: req.body.photolink,
        sellerName: JSON.stringify(currentUser)
 
        
    };
    let sql = "INSERT INTO goods SET ?";
    con.query(sql, data, (err,result)=>{
        if(err) throw err;
        res.status(200).json(data);

        
    })
    
  })

  //Поиск по id товара

  app.get('/items/:id', function(req, res) {
      let id = req.params.id;
      let sql = ("SELECT * FROM goods WHERE id = " + "'" + id + "'")
      con.query(sql, (err,result) => {
          if(err) throw err;
          res.status(200).json(result);
      })
  });


  //Изменение данных о товаре


  app.put('/items/:id', function(req, res) {
    let id = req.params.id;
    let data = {
        fieldToChange:  req.body.field,
        fieldNewValue: req.body.value
    }
    let sql = ("SELECT * FROM goods WHERE id = " + "'" + id + "'")
    con.query(sql, (err,result) => {
        if(err) throw err
        if(JSON.parse(result[0].sellerName).name == decodeToken().name){
            if(data.fieldToChange == 'product'){
                con.query('UPDATE goods SET product = ? WHERE id = ?',[data.fieldNewValue,id], (err, res) => {
                    if(err) throw err
                    res.send('product name changed')
                })
            }
            else if(data.fieldToChange == 'decrption'){
                con.query('UPDATE goods SET decrption = ? WHERE id = ?',[data.fieldNewValue,id], (err, res) => {
                    if(err) throw err
                    res.send('product description changed')
                })

            }
            else{
                res.send('No changes')
            }
        
        }
    })
});


//Удаление товара


app.delete('/items/:id', (req, res) => {
    let id = req.params.id;
    let sql = "SELECT * FROM goods WHERE id = " + "'" + id + "'";
    con.query(sql, (err,result) => {
        if(err) throw err
        if(JSON.parse(result[0].sellerName).name == decodeToken().name){
            con.query('DELETE FROM goods WHERE id = ?',id,(err,res) => {
                if(err) throw err
            })


        }

    })
    res.send('deleted'); 



})


//Загрузка изображения товара

app.post('/items/:id', upload.single('goodImage'), (req, res) => {
    let id = req.params.id;
    let sql = "SELECT * FROM goods WHERE id = " + "'" + id + "'";
    con.query(sql, (err,result) => {
        if(err) throw err
        if(JSON.parse(result[0].sellerName).name == decodeToken().name){
            res.send(req.file);
        }
        else{
            res.send('no permission')
        }
    })
})




















app.listen(3000, () => {
    console.log('Server started on port 3000')
});

