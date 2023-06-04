const { initializeApp, cert} = require('firebase-admin/app')
    const { getFirestore }=require('firebase-admin/firestore') 

    var serviceAccount = require('./medicompindia-c7f4e-firebase-adminsdk-e0fzk-667d87c904.json')
    initializeApp({ 
        credential : cert (serviceAccount)
    })      
        const db = getFirestore() 
    module.exports = { 
        saveData : function (req, callback){
             let medname = req.query['medname'] ; 
             firebase.database().ref("users/"+username).set({ 
                 name : req.medname, time : new Date(),
             })
            }
        };