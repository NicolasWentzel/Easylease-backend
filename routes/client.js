var express = require("express");
var router = express.Router();
const Client = require("../models/client");
const User = require("../models/users");
const Interlocutor = require("../models/interlocutor");
const { checkBody } = require("../modules/checkBody");

router.get("/allClients", (req, res) => {
  Client.find({})
    .populate("interlocutor")
    .then((data) => {
      if (data) {
        res.json({ result: true, clients: data });
      } else {
        res.json({ result: false, error: "Aucun client trouvé" });
      }
    });
});

router.get('/id/:clientId', (req,res) => {
  Client.findById({ _id : req.params.clientId})
  .populate("interlocutor")
  .then(data => {
    if(data) {
      res.json({result: true, client: data})
    } else {
      res.json({result: false, error: "Aucun client trouvé"})
    }
  })
});

router.get('/:clientName', (req,res) => {
  Client.findOne({ name : req.params.clientName})
  .populate("interlocutor")
  .then(data => {
    if(data) {
      res.json({result: true, client: data})
    } else {
      res.json({result: false, error: "Aucun client trouvé"})
    }
  })
});

router.post("/uploadClient", async (req, res) => {
  if (
    !checkBody(req.body, [
      "name",
      "interlocutors",
      "address",
      "numberOfEmployees",
      "chiffreAffaire",
    ])
  ) 
  {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  } else {

    let clientData = await Client.findOne({ name: req.body.name });

//vérifie l'existence ou non du client
if (clientData === null) {
  const newClient = new Client({
    name: req.body.name,
    address: req.body.address,
    numberOfEmployees: req.body.numberOfEmployees,
    clientBirth: req.body.clientBirth,
    chiffre: req.body.chiffreAffaire,
  });
  // Sauvegarder le client créé
  let newDoc = await newClient.save()
  // console.log('nouveau client créé',newDoc);
  // crée un document interlocuteur pour chaque entrée du tableau interlocutors venant du front
  req.body.interlocutors.map(async (e) => {
    const newInterlocutor = new Interlocutor({
      client: newDoc._id,
      phone: e.phoneNumber,
      name: e.name,
      firstname: e.firstname,
      email: e.email,
      poste: e.poste,
    });
    //sauvegarde le nouvel interlocuteur
    let newInterloc = await newInterlocutor.save();

    let clientToUpdate = await Client.updateOne(
      {
        _id: newDoc._id,
      },
      {
        $push: { interlocutor: newInterloc._id },
      }
    );
  });
      await User.updateOne(
    { token: req.body.token },
    {
      $push: { clients: newDoc._id },
    }
  );
}

}

});

router.post("/addInterlocutor", (req, res) => {
  if (
    !checkBody(req.body, [
      "client",
      "name",
      "firstname",
      "phone",
      "poste",
      "email",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  Client.findOne({ _id: req.body.client });
  const newInterlocutor = new Interlocutor({
    client: req.body.client,
    phone: req.body.phone,
    name: req.body.name,
    firstname: req.body.firstname,
    email: req.body.email,
    poste: req.body.poste,
  });
  //sauvegarde le nouvel interlocuteur
  newInterlocutor.save().then((data) => {
    Client.updateOne({ _id: req.body.client, },{$push: { interlocutor: data._id }})
    // .populate('interlocutor') //
    .then(() => { Client.findById({ _id: req.body.client })
    .populate('interlocutor').then(data => {
      if (data) {
        res.json({ result : true, data: data});
      } else {
        res.json({result: false, error: 'Client pas update avec le new interloc !'})
      }
    })
    })
  });
});

router.get('/test/:token', (req, res) => {
    User.findOne({ token: req.params.token })
        .populate('clients')
        .then(data => {
            if (data) {
                res.json({ result: true, clientsInfos: data})
            } else {
                res.json({ message: 'not found' })
            }
        })
});

module.exports = router;