const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'msnt-project',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/shadow', {
    useUnifiedTopology: true
});

// Schemas
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { versionKey: false });

const assessmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    subject: { type: String, required: true },
    answers: [{
        questionNumber: Number,
        userAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean
    }],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
}, { versionKey: false });

const User = mongoose.model('shadow', userSchema, 'monarch');
const Assessment = mongoose.model('Assessment', assessmentSchema);

// Middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    next();
};

// Routes
app.get('/', (req, res) => res.redirect(req.session.userId ? '/view' : '/home'));

app.get('/home', (req, res) => {
    if (req.session.userId) return res.redirect('/view');
    res.sendFile(path.join(__dirname, 'views/home.html'));
});

app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/view');
    res.sendFile(path.join(__dirname, 'views/register.html'));
});

app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/view');
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/view', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/view.html'));
});

app.get('/subjects/:subject', requireAuth, (req, res) => {
    const subject = req.params.subject.toLowerCase();
    if (['mnst', 'mc', 'cd', 'cns', 'ml'].includes(subject)) {
        res.sendFile(path.join(__dirname, `views/subjects/${subject}.html`));
    } else {
        res.status(404).send('Subject not found');
    }
});

// API Endpoints
app.get('/api/user', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.session.userId }).select('-password');
        if (!user) {
            req.session.destroy();
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/assessments', requireAuth, async (req, res) => {
    try {
        const assessments = await Assessment.find({ userId: req.session.userId })
            .sort({ submittedAt: -1 })
            .select('subject score totalQuestions percentage submittedAt');
        res.json(assessments);
    } catch (error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ error: 'Failed to fetch assessment history' });
    }
});

app.get('/api/assessments/:id', requireAuth, async (req, res) => {
    try {
        const assessment = await Assessment.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        res.json(assessment);
    } catch (error) {
        console.error('Error fetching assessment:', error);
        res.status(500).json({ error: 'Failed to fetch assessment' });
    }
});

app.post('/api/assessment', requireAuth, async (req, res) => {
    try {
        const { subject, answers, questions } = req.body;
        let score = 0;
        const answerDetails = [];

        questions.forEach((q, index) => {
            const isCorrect = answers[index] === q.correctAnswer;
            if (isCorrect) score++;

            answerDetails.push({
                questionNumber: index + 1,
                userAnswer: answers[index],
                correctAnswer: q.correctAnswer,
                isCorrect
            });
        });

        const percentage = Math.round((score / questions.length) * 100);

        const assessment = new Assessment({
            userId: req.session.userId,
            subject,
            answers: answerDetails,
            score,
            totalQuestions: questions.length,
            percentage
        });

        await assessment.save();

        res.json({
            success: true,
            assessmentId: assessment._id,
            score,
            totalQuestions: questions.length,
            percentage,
            message: 'Assessment saved successfully'
        });
    } catch (error) {
        console.error('Error saving assessment:', error);
        res.status(500).json({
            error: 'Failed to save assessment',
            details: error.message
        });
    }
});

app.post('/register', async (req, res) => {
    try {
        const { id, name, email, password } = req.body;

        if (await User.findOne({ $or: [{ userId: id }, { email }] })) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = new User({
            userId: id,
            name,
            email,
            password: await bcrypt.hash(password, 10)
        });

        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { id, password } = req.body;
        const user = await User.findOne({ userId: id });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.userId;
        res.redirect('/view');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/home');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});


// mongoose.connect('mongodb://127.0.0.1:27017/shadow', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })
// const User = mongoose.model('shadow', userSchema, 'monarch');