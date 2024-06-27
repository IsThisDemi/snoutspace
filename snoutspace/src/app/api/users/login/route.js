import { NextResponse } from "next/server";
import connectMongo from "../../../../lib/mongoose";
import User from "../../../../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req) {
  const { email, password } = await req.json();

  await connectMongo();

  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return NextResponse.json({ token });
}
