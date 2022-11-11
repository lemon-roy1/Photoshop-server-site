
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
// app.use(cors());
// app.use(express.json());
app.use(cors());
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER_SERVICT}:${process.env.DB_PASSWORD_SERVICE}@cluster0.yapakru.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });





function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
    const serviceCollection = client.db('servicesReview').collection('services');
        const reviewCollection = client.db('servicesReview').collection('reviews');
        app.post('/jwt', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10d'})
            res.send({token})
        })  

        //services create 
        app.post('/services', async(req, res)=>{
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result); 
        })

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services.reverse());
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });
      
        // reviews api
        app.get('/reviews',verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unauthorized access'})
            }

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        });

        app.post('/reviews',verifyJWT, async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });
       
 
       app.get('/reviews/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const rev = await reviewCollection.findOne(query);
        res.send(rev);
    })
        app.put('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const user = req.body;
            const option ={upsert:true};
            const updateUser = {
                $set:{
                    customer: user.customer,
                    email :user.email,
                    images :user.images,
                    message :user.message
                }
            }
           const result = await reviewCollection.updateOne(filter, updateUser, option);
           res.send(result);
        })


        app.delete('/reviews/:id', verifyJWT,  async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })


    }
    finally {

    }

}
 //user : servicebd
// pass : XW23sBUnmp2e5IsN
run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('Services Review server is running')
})

app.listen(port, () => {
    console.log(`Services Review server running on ${port}`);
})
