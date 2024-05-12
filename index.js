const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// Middleware

app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",

        ,
      ],
      credentials: true,
    })
  );

app.use(express.json());
app.use(cookieParser());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lblkdq0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const queryCollection = client.db('prodSphere').collection('queries');
        const recommendationCollection = client.db('prodSphere').collection('recommendations');




        app.post('/AddQuery', async (req, res) => {
            const queryInfo = req.body;
            console.log(queryInfo);
            const result = await queryCollection.insertOne(queryInfo);
            res.send(result);

        })

        app.post('/AddRecommendation', async (req, res) => {
            const recommendationInfo = req.body;
            console.log(recommendationInfo);
            const result = await recommendationCollection.insertOne(recommendationInfo);
            res.send(result);

        })

        app.delete('/myRecommendations/:id', async (req, res) => {

            const id = req.params.id;
            console.log(id);
            const result = await recommendationCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        }
        )


        //authentication related api

        app.post('/jwt', (req, res) => {
            const user = req.body;

            console.log(user);

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                
            }).send({success: true});
            res.send(token);
        })




        app.get('/recommendationsForMe/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
           const result = await recommendationCollection.find({ creatorEmail: email }).toArray();
            res.send(result);

        })

        app.patch('/AddQuery/id/:id', async (req, res) => {
            const id = req.params.id;
            const updatedInfo = req.body;
            console.log(updatedInfo);
            const result = await queryCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedInfo });
            res.send(result);
        })

        app.delete('/AddQuery/id/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const result = await queryCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        })


        app.get('/AddRecommendation', async (req, res) => {
            const result = await recommendationCollection.find({}).toArray();
            res.send(result);
        })

        app.get('/AddRecommendation/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const result = await recommendationCollection.find({ id: id }).toArray();
            res.send(result);
        })


        app.get('/myRecommendations/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const result = await recommendationCollection.find({ RecommenderEmail: email }).toArray();
            res.send(result);

        })




        app.get('/AddQuery', async (req, res) => {
            const result = await queryCollection.find({}).toArray();
            res.send(result);
        })


        app.get('/AddQuery/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            console.log('token', req.cookies.token);
            const result = await queryCollection.find({ email }).toArray();
            res.send(result);
        })

        app.get('/query/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const result = await queryCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        })

       



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('prodSphere is running')
})

app.listen(port, () => {
    console.log(`prodSphere is running on port http://localhost:${port}`)
})
