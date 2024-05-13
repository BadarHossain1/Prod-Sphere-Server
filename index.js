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
            
            
            "https://prod-sphere.netlify.app",
         
            "https://66416e7d82f5fe4352049eba--prod-sphere.netlify.app"

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


const logger = async (req, res, next) => {
    console.log('logging', req.host, req.originalUrl);
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token in middleware', token);
    if (!token) {
        res.status(401).send('Unauthorized');
        return;
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {

        if (err) {
            console.log('error', err);
            res.status(401).send('Unauthorized');
            return;
        }
        console.log('decoded', decoded);
        req.user = decoded;
        next();
    });


}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const queryCollection = client.db('prodSphere').collection('queries');
        const recommendationCollection = client.db('prodSphere').collection('recommendations');




        app.post('/AddQuery', logger, verifyToken, async (req, res) => {
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

        app.post('/jwt', logger, (req, res) => {
            const user = req.body;

            console.log(user);

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

            // res.cookie('token', token, {
            //     httpOnly: true,
            //     secure: false,
            //     sameSite: 'none',

            // }).send({success: true});
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production"?true:false,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            };
            res.cookie('token', token, cookieOptions).send({ success: true });
        }

        )

        app.post("/logout", async (req, res) => {
            const user = req.body;
            console.log("logging out", user);
            res
                .clearCookie("token", { ...cookieOptions, maxAge: 0 })
                .send({ success: true });
        });




        app.get('/recommendationsForMe/:email', logger, verifyToken, async (req, res) => {
            const email = req.params.email;

            if (req.user.email !== email) {
                res.status(401).send('Unauthorized');
                return;
            }
            console.log(email)
            const result = await recommendationCollection.find({ creatorEmail: email }).toArray();
            res.send(result);

        })

        app.patch('/AddQuery/id/:id', logger, verifyToken, async (req, res) => {
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

        app.get('/AddRecommendation/:id', logger, verifyToken, async (req, res) => {
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


        app.get('/AddQuery/:email',  async (req, res) => {
            const email = req.params.email;
            console.log(email)
            if (req.user.email !== email) {
                res.status(401).send('Unauthorized');
                return;
            }
            console.log('token', req.cookies.token);
            const result = await queryCollection.find({ email }).toArray();
            res.send(result);

        })

        app.get('/query/:id', logger, verifyToken, async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const result = await queryCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        })





        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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
