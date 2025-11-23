import mongoose from 'mongoose';

export async function connectDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/little-mouse-ai');
        console.log("🟢 MongoDB 已成功连接！");
    } catch (error) {
        console.error("🔴 MongoDB 连接失败：", error);
        process.exit(1);
    }
}
