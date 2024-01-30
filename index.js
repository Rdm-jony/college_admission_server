const express = require('express');
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
require("dotenv").config()

// middlware
app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.send("college admission server running")
})

app.listen(port, () => {
    console.log(`college admission sever running on ${port}`)
})

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tbsccmb.mongodb.net/?retryWrites=true&w=majority`;

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
        const userCollection = client.db(`${process.env.DB_USER}`).collection("userCollection");
        const collegeCollection = client.db(`${process.env.DB_USER}`).collection("collegeCollection");
        const feedbackCollection = client.db(`${process.env.DB_USER}`).collection("reviewCollection");
        const myCollegeCollection = client.db(`${process.env.DB_USER}`).collection("myCollegeCollection");
        const collegeFormCollection = client.db(`${process.env.DB_USER}`).collection("collegeFormCollection");

        app.post("/user", async (req, res) => {

            const result = await userCollection.insertOne(req.body)
            res.send(result)
        })
        app.get("/userRole/:email", async (req, res) => {
            const result = await userCollection.findOne({ email: req.params.email })

            res.send({ "role": result?.role })

        })

        app.get("/bannerData", async (req, res) => {
            const result = await collegeCollection.find({ top: true }).limit(3).toArray()
            res.send(result);
        })

        app.post("/feedback/:email", async (req, res) => {
            const email = req.params.email;
            const feedback = req.body;
            const user = await userCollection.findOne({ email: email })
            feedback.image = user.image;
            feedback.name = user.name;
            const result = await feedbackCollection.insertOne(feedback)
            res.send(result)
        })

        app.get("/feedback", async (req, res) => {
            const result = await feedbackCollection.find({}).toArray()
            res.send(result)
        })

        app.post("/formdata/:email", async (req, res) => {
            const email = req.params.email;
            const collegeId = req.body.collegeId
            const fonudEmail = await myCollegeCollection.findOne({ email: email })
            if (fonudEmail) {
                const result = await myCollegeCollection.updateOne({ email: email }, { $push: { addColleges: collegeId } })
                res.send(result)
            } else {
                const doc = {
                    email: email,
                    addColleges: [
                        collegeId
                    ]
                }
                const result = await myCollegeCollection.insertOne(doc)
                res.send(result)
            }
        })

        app.post("/formCollection/:collegeId", async (req, res) => {
            const collegeId = req.params.collegeId;
            const formdata = req.body;
            const foundCollegeId = await collegeFormCollection.findOne({ collegeId: collegeId })
            if (foundCollegeId) {
                const result = await collegeFormCollection.updateOne({ collegeId: collegeId }, { $push: { addForm: formdata } })
                res.send(result)
            } else {
                const doc = {
                    "collegeId": collegeId,
                    "addForm": [
                        formdata
                    ]
                }
                const result = await collegeFormCollection.insertOne(doc)
                res.send(result)
            }
        })

        app.get("/myColleges/:email", async (req, res) => {
            const email = req.params.email;
            const result = await myCollegeCollection.findOne({ email: email })
            const collegeId = result?.addColleges;
            const allColleges = await collegeCollection.find({}).toArray()
            const myColleges = []
            collegeId?.map(id => {
                console.log(id)
                const findCollege = allColleges.find(item => item._id == id)
                myColleges.push(findCollege)
            })
            res.send(myColleges)
        })
        app.get("/allCollege", async (req, res) => {
            const result = await collegeCollection.find({}).toArray()
            res.send(result)
        })
        app.get("/profile/:email", async (req, res) => {
            const email = req.params.email;
            const result = await userCollection.findOne({ email: email })
            console.log(result)
            res.send(result)
        })
        app.put("/profile/:email", async (req, res) => {
            const email = req.params.email;
            const upDateInfo = req.body;
            const query = { email: email };
            const doc = {
                $set: upDateInfo
            }
            const options = { upsert: true }
            const result = await userCollection.updateOne(query, doc, options)
            res.send(result)

        })
        app.put("/updateuser/:email", async (req, res) => {
            const email = req.params.email;
            const updateInfo = req.body;
            const filter = {
                email: email
            }
            const doc = {
                $set: updateInfo
            }
            const options = {
                upsert: true
            }
            const result = await userCollection.updateOne(filter, doc, options)
            res.send(result)
        })

        app.get("/searchColleges/:searchText", async (req, res) => {
            const text = req.params.searchText;
            const result = await collegeCollection.find({ collegeName: { $regex: text } }).toArray()
            res.send(result)
        })
        app.post("/addCollege", async (req, res) => {
            const collegeInfo = req.body;
            const result = await collegeCollection.insertOne(collegeInfo)
            res.send(result)
        })
        app.post("/colleges/addToTop/:collegeId", async (req, res) => {
            const collegeId = req.params.collegeId;
            const isTop = req.body;

            const filter = { _id: new ObjectId(collegeId) }
            const updateDoc = {
                $set: isTop
            }
            const options = { upsert: true }
            const result = await collegeCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        app.get("/allUsers", async (req, res) => {
            const result = await userCollection.find({}).toArray()
            res.send(result)
        })
        app.post("/users/admin/:userId", async (req, res) => {
            const userId = req.params.userId;
            const role = req.body;
            const filter = {
                _id: new ObjectId(userId)
            }
            const updateDoc = {
                $set: role
            }
            const options = { upsert: true }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

    } finally {
        // Ensures that the client will close when you finish/error

    }
}
run().catch(console.dir);
