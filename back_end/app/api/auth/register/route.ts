import { hashPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { registerSchema } from "@/app/lib/validation";
import { isEmailVerified, cleanupVerificationRecord } from "@/app/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // FormData로 변경
    const formData = await request.formData();
    
    // 필드 추출
    const body = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
      studentId: formData.get('studentId') as string,
      major: formData.get('major') as string,
      class: formData.get('year') as string, // 프론트에서 'year'로 보내면
    };
    
    const validatedData = registerSchema.parse(body);

    // Check if email is verified
    const emailVerified = await isEmailVerified(validatedData.email);
    if (!emailVerified) {
      return NextResponse.json(
        {
          error:
            "Email not verified. Please verify your email before registration.",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if studentId already exists
    const existingStudentId = await prisma.user.findUnique({
      where: { studentId: validatedData.studentId },
    });

    if (existingStudentId) {
      return NextResponse.json(
        { error: "User with this student ID already exists" },
        { status: 400 }
      );
    }

    // Get default role
    const defaultRole = await prisma.role.findFirst({
      where: { name: "non-member" },
    });

    if (!defaultRole) {
      await prisma.role.create({
        data: {
          name: "non-member",
          description: "Default role",
        },
      });
    }

    const roleId =
      defaultRole?.id ||
      (await prisma.role.findFirst({ where: { name: "non-member" } }))?.id ||
      3;

    const hashedPassword = await hashPassword(validatedData.password);

    // Handle signature image if provided
    let signatureImageId: number | undefined = undefined;
    const signatureFile = formData.get('signatureImage') as File | null;
    
    if (signatureFile && signatureFile.size > 0) {
      // 파일을 Buffer로 변환
      const bytes = await signatureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // 파일 저장 경로 설정
      const filename = `signature_${uuidv4()}.png`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'signatures');
      const filepath = path.join(uploadDir, filename);
      
      // 디렉토리 생성 (없으면)
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // 디렉토리가 이미 존재하는 경우 무시
      }
      
      // 파일 저장
      await writeFile(filepath, buffer);
      
      // Create file record for signature
      const fileRecord = await prisma.file.create({
        data: {
          filename: filename,
          originalName: signatureFile.name,
          mimetype: signatureFile.type,
          size: signatureFile.size,
          purpose: "signature",
          path: `/uploads/signatures/${filename}`,
          uploaderId: 1, // Temporary, will be updated after user creation
        },
      });
      signatureImageId = fileRecord.id;
    }

    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        studentId: validatedData.studentId,
        major: validatedData.major,
        class: validatedData.class,
        signatureImageId: signatureImageId,
        status: "pending_approval",
        roleId: roleId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        studentId: true,
        major: true,
        class: true,
        status: true,
        createdAt: true,
      },
    });

    // Update the file record with the correct uploader ID if signature was uploaded
    if (signatureImageId) {
      await prisma.file.update({
        where: { id: signatureImageId },
        data: { uploaderId: newUser.id },
      });
    }

    // Clean up verification record after successful registration
    await cleanupVerificationRecord(validatedData.email);

    return NextResponse.json(
      {
        message: "Registration successful. Please wait for admin approval.",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}