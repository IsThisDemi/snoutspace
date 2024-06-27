import { NextResponse } from "next/server";
import connectMongo from "../../../../lib/mongoose";
import User from "../../../../models/User";
import bcrypt from "bcrypt";

export async function POST(req) {
  const { username, email, password } = await req.json();

  await connectMongo();

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ username, email, password: hashedPassword });

  try {
    await user.save();
    return NextResponse.json({ message: "User registered successfully!" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error registering user." },
      { status: 500 }
    );
  }
}
