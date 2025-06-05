const express = require('express'); //express서버 기본 라우팅
const app = express(); //express기본 라우팅
const port = 9070; //서버 포트

const cors = require('cors'); //교차출저공유 허용

app.use(cors());
app.use(express.json());

const mysql = require('mysql');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'test';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'kdt'
});

connection.connect((err) => {
    if(err){
        console.log('mySql 연결 실패: ', err);
        return;
    }
    console.log('mySql 연결 성공');
});

// mysql db연결 테스트(메세지)
// app.get('/', (req, res)=> {
//     // 특정 경로로 요청된 정보를 처리
//     res.json('Excused from Backend');
// });

app.post('/login', (req, res) => {
    const {username, password} = req.body;

    connection.query('SELECT * FROM users WHERE username=?', [username], (err, results) => {
    if(err||results.length===0) {
        return res.status(401).json({error: '아이디 또는 비밀번호가 틀립니다'});
    }
    const user = results[0];
    bcrypt.compare(password, user.password)
        .then(isMatch => {
            if(!isMatch) {
                return res.status(401).json({error : '아이디 또는 비밀번호가 틀립니다'});
            }
            const token = jwt.sign({id:user.id, username:user.username}, SECRET_KEY, {expiresIn:'1h'});
            res.json({token});
        })
        .catch(err => {
            res.status(500).json({error: '서버 오류'});
        });
    });
})

app.post('/login2', (req, res)=> {
    const {username, password} = req.body;

    connection.query(
        'SELECT * FROM users2 WHERE username=?', [username], (err, results) => {
            if(err||results.length===0) {
                return res.status(401).json({err: '아이디 또는 비밀번호가 틀립니다'});
            }
            const user2 = results[0];
            bcrypt.compare(password, user2.password)
                .then(isMatch => {
                    if(!isMatch) {
                        return res.status(401).json({error: '아이디 또는 비밀번호가 틀립니다'});
                    }
                    const token = jwt.sign({id:user2.id, username:user2.username}, SECRET_KEY, {expiresIn: '1h'});
                    res.json({token});
                })
                .catch(err => {
                    res.status(500).json({error: '서버 오류'});
                });
        }
    )
})

app.post('/register', async(req, res) => {
    const {username, password} = req.body;
    const hash = await bcrypt.hash(password, 10);
    
    connection.query(
        'INSERT INTO users (username, password) VALUES (?,?)', [username, hash], (err) => {
            if(err) {
                if(err.code == 'ER_DUP_ENTRY') {
                    return res.status(400).json({error:'이미 존재하는 아이디입니다'});
                }
                return res.status(500).json({error:'회원가입 실패'});
            }
            res.json({success:true});
        }
    )
})

app.post('/register2', async(req, res)=> {
    const {username, password, email, tel} = req.body;
    const hash2 = await bcrypt.hash(password, 10);

    connection.query(
        'INSERT INTO users2 (username, password, email, tel) VALUES (?,?,?,?)', [username, hash2, email, tel], (err) => {
            if(err) {
                if(err.code == 'ER_DUP_ENTRY') {
                    return res.status(400).json({error: '이미 존재하는 아이디입니다'});
                }
                return res.status(500).json({error: '회원가입 실패'});
            }
            res.json({success:true});
        }
    )
});

// mysql db연결 테스트(data)
app.get('/goods', (req, res)=> {
    // 특정 경로로 요청된 정보를 처리
    connection.query('SELECT * FROM goods ORDER BY goods .g_code DESC', (err, results)=>{
        if(err) {
            console.log('db연결 실패: ', err);
            res.status(500).json({error: 'DB 연결 실패'});
            return;
        }
        res.json(results);
    })
});

app.get('/books', (req, res)=> {
    // 특정 경로로 요청된 정보를 처리
    connection.query('SELECT * FROM book_store ORDER BY book_store .num DESC', (err, results)=>{
        if(err) {
            console.log('db연결 실패: ', err);
            res.status(500).json({error: 'DB 연결 실패'});
            return;
        }
        res.json(results);
    })
});

app.get('/fruits', (req, res)=> {
    // 특정 경로로 요청된 정보를 처리
    connection.query('SELECT * FROM fruit ORDER BY fruit .num DESC', (err, results)=>{
        if(err) {
            console.log('db연결 실패: ', err);
            res.status(500).json({error: 'DB 연결 실패'});
            return;
        }
        res.json(results);
    })
});

app.delete('/goods/:g_code', (req,res) => {
    const g_code = req.params.g_code;
    connection.query(
        'DELETE FROM goods WHERE g_code=?', [g_code],
        (err, result)=> {
            if(err){
                console.log('삭제 오류 : ', err);
                res.status(500).json({err: '상품 삭제 실패'});
                return;
            }
            res.json({success:true});
        }
    );
});

app.delete('/books/:num', (req,res) => {
    const num = req.params.num;
    connection.query(
        'DELETE FROM book_store WHERE num=?', [num],
        (err, result)=> {
            if(err){
                console.log('삭제 오류 : ', err);
                res.status(500).json({err: '주문 내역 삭제 실패'});
                return;
            }
            res.json({success:true});
        }
    );
});

app.delete('/fruits/:num', (req,res) => {
    const num = req.params.num;
    connection.query(
        'DELETE FROM fruit WHERE num=?', [num],
        (err, result)=> {
            if(err){
                console.log('삭제 오류 : ', err);
                res.status(500).json({err: '상품 정보 삭제 실패'});
                return;
            }
            res.json({success:true});
        }
    );
});

app.put('/goods/update/:g_code', (req, res) => {
    const g_code = req.params.g_code;
    const {g_name, g_cost} = req.body;

    connection.query(
        'UPDATE goods SET g_name=?, g_cost=? WHERE g_code=?', [g_name, g_cost, g_code], 
        (err, result) => {
            if(err) {
                console.log('수정 오류 : ', err);
                res.status(500).json({error : '상품수정하기 실패'});
                return;
            }
            res.json({success:true});
        }
    )
});

app.put('/books/update/:num', (req, res) => {
    const num = req.params.num;
    const {name, area1, area2, area3, BOOK_CNT, owner_nm, tel_num} = req.body;

    connection.query(
        'UPDATE book_store SET name=?, area1=?, area2=?, area3=?, BOOK_CNT=?, owner_nm=?, tel_num=? WHERE num=?', [name, area1, area2, area3, BOOK_CNT, owner_nm, tel_num, num], 
        (err, result) => {
            if(err) {
                console.log('수정 오류 : ', err);
                res.status(500).json({error : '주문내역 수정하기 실패'});
                return;
            }
            res.json({success:true});
        }
    )
});

app.put('/fruits/update/:num', (req, res) => {
    const num = req.params.num;
    const {name, price, color, country} = req.body;

    connection.query(
        'UPDATE fruit SET name=?, price=?, color=?, country=? WHERE num=?', [name, price, color, country, num], 
        (err, result) => {
            if(err) {
                console.log('수정 오류 : ', err);
                res.status(500).json({error : '상품 내역 수정하기 실패'});
                return;
            }
            res.json({success:true});
        }
    )
});

app.get('/goods/:g_code', (req, res) => {
    const g_code = req.params.g_code;

    connection.query (
        'SELECT  * FROM goods WHERE g_code=?',
        [g_code],
        (err, results) => {
            if(err) {
                console.log('조회 오류 : ', err);
                res.status(500).json({error: '상품 조회 실패'});
                return;
            }
            if(results.length===0) {
                res.status(404).json({error: '해당 상품이 존재하지 않습니다'});
                return;
            }
            res.json(results[0]);
        }
    )
});

app.get('/books/:num', (req, res) => {
    const num = req.params.num;

    connection.query (
        'SELECT  * FROM book_store WHERE num=?',
        [num],
        (err, results) => {
            if(err) {
                console.log('조회 오류 : ', err);
                res.status(500).json({error: '주문 내역 조회 실패'});
                return;
            }
            if(results.length===0) {
                res.status(404).json({error: '해당 주문 내역이 존재하지 않습니다'});
                return;
            }
            res.json(results[0]);
        }
    )
});

app.get('/fruits/:num', (req, res) => {
    const num = req.params.num;

    connection.query (
        'SELECT  * FROM fruit WHERE num=?',
        [num],
        (err, results) => {
            if(err) {
                console.log('조회 오류 : ', err);
                res.status(500).json({error: '상품 정보 조회 실패'});
                return;
            }
            if(results.length===0) {
                res.status(404).json({error: '해당 상품이 존재하지 않습니다'});
                return;
            }
            res.json(results[0]);
        }
    )
});

app.post('/goods', (req, res)=> {
    const {g_name, g_cost} = req.body;
    if(!g_name||!g_cost) {
        return res.status(400).json({error: '필수 항목이 누락되었습니다. 다시 확인하세요'});
    }

    connection.query (
        'INSERT INTO goods (g_name, g_cost) VALUES (?, ?)', [g_name, g_cost],
        (err, result) => {
            if(err) {
                console.log('등록 실패 : ', err);
                res.status(500).json({error : '상품 등록 실패'});
                return;
            }
            res.json({success:true, insertID: result.insertID})
        }
    )
})

app.post('/books', (req, res)=> {
    const {name, area1, area2, area3, BOOK_CNT, owner_nm, tel_num} = req.body;
    if(!name||!area1||!area2||!area3||!BOOK_CNT||!owner_nm||!tel_num) {
        return res.status(400).json({error: '필수 항목이 누락되었습니다. 다시 확인하세요'});
    }

    connection.query (
        'INSERT INTO book_store (name, area1, area2, area3, BOOK_CNT, owner_nm, tel_num) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, area1, area2, area3, BOOK_CNT, owner_nm, tel_num],
        (err, result) => {
            if(err) {
                console.log('등록 실패 : ', err);
                res.status(500).json({error : '주문내역 등록 실패'});
                return;
            }
            res.json({success:true, insertID: result.insertID})
        }
    )
})

app.post('/fruits', (req, res)=> {
    const {name, price, color, country} = req.body;
    if(!name||!price||!color||!country) {
        return res.status(400).json({error: '필수 항목이 누락되었습니다. 다시 확인하세요'});
    }

    connection.query (
        'INSERT INTO fruit (name, price, color, country) VALUES (?, ?, ?, ?)', [name, price, color, country],
        (err, result) => {
            if(err) {
                console.log('등록 실패 : ', err);
                res.status(500).json({error : '상품 등록 실패'});
                return;
            }
            res.json({success:true, insertID: result.insertID})
        }
    )
})

app.post('/qna', (req, res) => {
    const{name, tel, email, content} = req.body;
    if(!name||!tel||!email||!content) {
        return res.status(400).json({error:'필수 항목이 누락되었습니다. 다시 확인하세요'});
    }
    connection.query(
        'INSERT INTO question (name, tel, email, content) VALUES (?, ?, ?, ?)',
        [name, tel, email, content], 
        (err, result) => {
            if (err) {
                console.log('등록 오류: ', err);
                res.status(500).json({error: '질문 등록 실패'});
                return;
            }
            res.send('질문 등록 완료');
        }
    );
})

app.get('/qna/count', (req, res) => {
    connection.query('SELECT COUNT(*) AS count FROM question', (err, results) => {
        if (err) {
            res.status(500).json({error: '질문 개수 조회 실패'});
            return;
        }
        res.json({count: results[0].count});
    });
});

app.listen(port, () => {
    console.log('listening ...');
});
