const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const mailConfig = require('../config/configMail.json');
//const { sendConfirmationEmail } = require('../nodemailer');

////register user

const registerUser = asyncHandler(async (req, res) => {
    const { name, email,DateOfBirth, password } = req.body

    if (!name || !email || !password || !DateOfBirth ) {
        res.status(400)
        throw new Error('Please enter all fields')
    }

    const userExists = await User.findOne({ email })

    if (userExists) {
        res.status(400).send('user exists')
        throw new Error('User already exists')
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    ////confirmationMail////
    const characters =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let activationCode = "";
    for (let i = 0; i < 25; i++) {
        activationCode += characters[Math.floor(Math.random() * characters.length)];
    }



    ////confirmationMail////
    const user = await User.create({
        name,
        email,
        DateOfBirth,
        password: hashedPassword,
        //jdid
        activationCode: activationCode,
    })




    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            DateOfBirth: user.DateOfBirth,
            token: generateToken(user._id),

        })
        sendConfirmationEmail(user.email, user.activationCode);
    } else {
        res.status(400)
        throw new Error('Invalid user data')
    }
});

////login user

const LoginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    const user = await User.findOne({ email })

    if (user
        && user.isConfirmed
        && (!user.isDeleted)
        && (!user.isBlocked)
        && (await bcrypt.compare(password, user.password))) {
        const { password, ...userWithoutPassword } = user.toObject();
        res.json({
            user: userWithoutPassword,
            token: generateToken(user._id),


        })
    } else if (user && !user.isConfirmed) {
        res.status(401).send("Please confirm your email")
        throw new Error('Please confirm your email')
    } else if (user && user.isDeleted) {
        res.status(401).send("Your account is deleted")
        throw new Error('Your account is deleted')
    } else if (user && user.isBlocked) {
        res.status(401).send("Your account is blocked")
        throw new Error('Your account is blocked')
    }
    else {
        res.status(401).send("invalid email or password")
        throw new Error('Invalid email or password')
    }
    console.log(user);
});

////generate token

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    })
}

const GetUser = asyncHandler(async (req, res) => {
    res.status(200).json(req.user)
});


//****************** update  *****************/

////////////confirmation de compte//////////
const sendConfirmationEmail = async (email, activationCode) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: mailConfig.emailUser,
                pass: mailConfig.emailPassword
            }
        });
        const mailOptions = {
            from: mailConfig.emailUser,
            to: email,
            subject: 'For account confirmation',
            // html : '<p> Welcome ' + name + ',Please copy the link <a href="http://localhost:3000/reset-password?token='+token+'">  and reset your password </a>'
            html: `
            <div>
            <h1>Activation du compte </h1>
              
              <p>Veuillez confirmer votre email en cliquant sur le lien suivant
      </p>
              <a href=http://localhost:3000/confirm/${activationCode}>Cliquez ici
      </a>
      
              </div>`

        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Mail has been sent", info.response);
            }
        });

    } catch (error) {
        //res.status(400).send({success:false,msg:error.message});
    }

}





///send mail

const sentResetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: mailConfig.emailUser,
                pass: mailConfig.emailPassword
            }
        });
        const mailOptions = {
            from: mailConfig.emailUser,
            to: email,
            subject: 'For Reset Password',
            // html : '<p> Welcome ' + name + ',Please copy the link <a href="http://localhost:3000/reset-password?token='+token+'">  and reset your password </a>'
            html: '<p> Welcome ' + name + ', Go to this  <a href="http://localhost:3000/new-submit">  link  </a> and  enter this number  ' + token + ' to reset your password'

        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Mail has been sent", info.response);
            }
        });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}


/// forget password 

const forgetPassword = async (req, res, next) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email });
        if (user) {
            console.log("hello");
            // const randomstringtoken = randomstring.generate();
            const _otp = Math.floor(100000 + Math.random() * 900000);
            // console.log(randomstringtoken);
            console.log(_otp);
            // const data = await User.updateOne({email},{$set:{tokenPass : randomstringtoken}});
            const data = await User.updateOne({ email }, { $set: { otp: _otp } });

            // sentResetPasswordMail(user.name , user.email,randomstringtoken);
            sentResetPasswordMail(user.name, user.email, _otp);

            res.status(200).send({ success: true, msg: "Please check your inbox " });
        } else {
            res.status(400).send("The given mail does not exist");
        }
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

/// reset password

const resetPassword = async (req, res) => {
    try {
        const token = req.query.token;

        const tokenUser = await User.findOne({ tokenPass: token });
        console.log(tokenUser.email);
        if (tokenUser) {
            const password = req.body.password;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const userData = await User.findByIdAndUpdate({ _id: tokenUser._id }, {
                $set: {
                    password: hashedPassword,
                    tokenPass: ''
                }
            }, { new: true });
            res.status(200).send({ success: true, msg: " Password has been reset", data: userData });


        } else {
            res.status(400).send({ success: false, msg: "this link has bee expired" });

        }

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}
const submitotp = async (req, res) => {
    console.log(req.body)
    let user = await User.findOne({ otp: req.body.otp });
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = User.updateOne({ email: user.email }, { password: hashedPassword, otp: null }).then(result => {
        res.send({ code: 200, message: 'Password updated' })
    }).catch(err => {
        res.send({ code: 500, message: 'Server err' })
    })


    // .then(result => {
    //     //  update the password 
    //     User.updateOne({ email: result.email }, { password: req.body.password })
    //         .then(result => {
    //             res.send({ code: 200, message: 'Password updated' })
    //         })
    //         .catch(err => {
    //             res.send({ code: 500, message: 'Server err' })
    //         })
    // }).catch(err => {
    //     res.send({ code: 500, message: 'otp is wrong' })
    // })
}

//             Fetch User By id 
const findById = (req, res, next) => {

    const id = req.params.id;
    User.findOne({ _id: req.params.id })
        .then((user) => { (user) ? res.send(user) : res.status(400).send({ message: "Not found user with id " + req.params.id }) })
        .catch((err) => res.status(500).send({ message: "Error retrieving user with id " + req.params.id, error: +err }))

}



//            Desactivate account
const desactivateAccount = async (req, res) => {
    try {

        const user = await User.findByIdAndUpdate(req.params.id, {
            $set: {
                isActivated: false
            }
        }, { new: true });
        res.status(200).send({ success: true, msg: " The user " + user.name + " is blocked", data: user });


    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}

//           Editer account 
const update = (req, res) => {

    if (Object.keys(req.body).length === 0) { return res.status(400).send({ message: "User with new informations must be provided" }) }

    const id = req.params.id;

    //The { useFindAndModify: false} option is used to avoid using the deprecated findAndModify() method
    //The { new: true } option tells Mongoose to return the updated document instead of the original one.
    User.findByIdAndUpdate(id, req.body, { useFindAndModify: false, new: true })
        .then(user => { (!user) ? res.status(404).send({ message: `Cannot Update user with ${id}. Maybe user not found!` }) : res.send(user) })
        .catch(err => res.status(500).json({ message: "Error Update user information", error: err }))
}





// block User 
const blockUser = async (req, res) => {
    try {

        const user = await User.findByIdAndUpdate(req.params.id, {
            $set: {
                isBlocked: true
            }
        }, { new: true });
        res.status(200).send({ success: true, msg: " The user " + user.name + " is blocked", data: user });


    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}
// unblock User 
const unblockUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate({ _id: req.params.id }, {
            $set: {
                isBlocked: false
            }
        }, { new: true });
        res.status(200).send({ success: true, msg: " The user " + user.name + " is unblocked", data: user });


    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}


const verifyUser = async(req,res)=>{
    
    User.findOne({activationCode: req.params.activationCode}, function(err, user) {
        if (err) {
          // Handle error
          console.log("errror")
        }
      
        // Update the field
        user.isConfirmed = true;
      
        // Save the changes
        user.save(function(err) {
          if (err) {
            // Handle error
            console.log("error2")
          }
      
          // Document updated successfully
          res.send('Document updated');
        });
      });











    // User.find({activationCode: req.params.activationCode})
    // .then((user)=>{
    //     if(!user){
    //         res.send({
    //             message:"this code is not valid !"
    //         });
    //     }
    //    else{ 
    //     user.isConfirmed =true;
    //     user.save();
    //     console.log(user.isConfirmed);
    //     //user.isConfirmed=true;
    //     // User.findByIdAndUpdate({ _id: user._id }, {
    //     //     $set: {
    //     //         isConfirmed: true,
    //     //     }
    //     // }, { new: true });
    //     res.send({
    //         message: "Account activated successfuly !"
    //     });
    // }; 
    // })
    
}



module.exports = {
    findById,
    update,
    desactivateAccount,
    registerUser,
    LoginUser,
    GetUser,
    resetPassword,
    forgetPassword,
    blockUser,
    unblockUser,
    submitotp,
    verifyUser,
}