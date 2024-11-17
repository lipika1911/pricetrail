import mongoose from 'mongoose';

console.log('Mongoose version:', mongoose.version);

const testConnection = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/testdb', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

testConnection();
