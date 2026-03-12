// One-time seed script: run with
// DATABASE_URL="..." npx tsx script/seed.ts
import { db, pool } from "../server/db";
import { users, rooms } from "../shared/schema";

const teachers = [
  { name: "Hofer, Inka", password: "Adm!9xH#k2Tz" },
  { name: "Haenicke, Sonja", password: "Adm!4vP#q8Nr" },
  { name: "Wischinski", password: "Adm!7bM#x5Jp" },
  { name: "Tewes, Tanja", password: "Adm!2sG#h9Lx" },
  { name: "Bähne, Nils", password: "Adm!5fK#r3Vz" },
  { name: "Langlott, Christian", password: "Adm!8pD#m6Bg" },
  { name: "Benke, Haider", password: "Adm!3nJ#v7Qx" },
];

const students = [
  { name: "Al Saleh, Raman Jamal Hassan", class: "10R2", password: "Px7!k9M#q2Lz" },
  { name: "Albrecht, Anna", class: "10R2", password: "Bv4@n8D*s5Jp" },
  { name: "Amrein, Saphira Juliana", class: "10R2", password: "Rm9!t2G#w7Kx" },
  { name: "Böcker, Fynn", class: "10R2", password: "Lq3@y6H*b4Nc" },
  { name: "Bullerdiek, Lennart Fynn", class: "10R2", password: "Tv8!x5M#p9Zr" },
  { name: "Dürre, Tayler", class: "10R2", password: "Kp2@s7V*m3Fq" },
  { name: "Fiolka, Maya", class: "10R2", password: "Xn6!d9B#h5Wj" },
  { name: "Gorani, Adelina", class: "10R2", password: "Mz5@r2K*t8Gy" },
  { name: "Griebe, Luca Finn", class: "10R2", password: "Yb3!f7J#n4Lv" },
  { name: "Hoppe, Zoe", class: "10R2", password: "Qd9@k4M*w2Px" },
  { name: "Krawzow, Liliana", class: "10R2", password: "Hf5!p8T#s3Bn" },
  { name: "Mela Ali, Amina", class: "10R2", password: "Jn7@t2X*v9Mr" },
  { name: "Melnik, Dennis", class: "10R2", password: "Ck4!z6G#h8Lb" },
  { name: "Önel, Mirxan", class: "10R2", password: "Vm9@n5P*q2Tr" },
  { name: "Rißland, Lukas", class: "10R2", password: "Bc2!w8S#x7Fd" },
  { name: "Salewski, Anthony", class: "10R2", password: "Gy5@t3V*k8Pn" },
  { name: "Skala, Julia", class: "10R2", password: "Nz9!p4H#v2Mj" },
  { name: "Spangenberg, Zaira Maja Josephine", class: "10R2", password: "Xb6@r3K*l7Qw" },
  { name: "Sünnemann, Ole", class: "10R2", password: "Df4!m9X#s2Bt" },
  { name: "Sulek, Tom", class: "10R2", password: "Gw8@n5J*k3Lr" },
  { name: "Teiwes, Lena-Marie", class: "10R2", password: "Vz9!t4P#x7Mk" },
  { name: "Titze, Niclas", class: "10R2", password: "Hb3@s6K*y2Ng" },
  { name: "Wahle, Thilo", class: "10R2", password: "Jp5!d9W#r4Lv" },
  { name: "Weimann, Daniel", class: "10R2", password: "Qx2@t7M*b8Pz" },
  { name: "Zorlu, Nilay", class: "10R2", password: "Sn4!k9H#v3Gr" },
  { name: "Bartels, Ilayda Derya", class: "10R1", password: "Fv7!p2X#m9Kz" },
  { name: "Bartram, Mia", class: "10R1", password: "Lx4@s8B*w5Nd" },
  { name: "Beichert, Maximilian", class: "10R1", password: "Tz9!d4H#v7Mh" },
  { name: "Berauer, Bianka", class: "10R1", password: "Bc3@r6K*l2Px" },
  { name: "Braun, Chris", class: "10R1", password: "Gn8!t5V#m3Jq" },
  { name: "Bullerdiek, Titus Jonah", class: "10R1", password: "Mk6@p9H*x4Rv" },
  { name: "Damm, Sophia", class: "10R1", password: "Dq2!w7S#n5Lf" },
  { name: "Dreißigacker, Briony", class: "10R1", password: "Vz8@t3P*k7Ny" },
  { name: "Hammer, Amy", class: "10R1", password: "Jb5!f9X#s2Mk" },
  { name: "Heine, Fynn", class: "10R1", password: "Qp9@n4H*r7Dz" },
  { name: "Kaiser, Julius", class: "10R1", password: "Xv4!t8M#j3Gn" },
  { name: "Kurylo, Anastasia", class: "10R1", password: "Hf2@s7V*m5Kb" },
  { name: "Mahmoud, Hitham", class: "10R1", password: "Nz9!k4L#p2Tx" },
  { name: "Movsesiants, Elene", class: "10R1", password: "Cw6@v3P*x8Mj" },
  { name: "Nordmann, Adrian", class: "10R1", password: "Rb5!f7J#t4Nq" },
  { name: "Osaj, Justus Timm", class: "10R1", password: "Yd9@p4K*v2Xm" },
  { name: "Parkhomenko, Margarita", class: "10R1", password: "Hb4!t8S#j5Nr" },
  { name: "Petersen, Jule Charlotte", class: "10R1", password: "Jx6@r2M*t9Pv" },
  { name: "Sabsabi, Lana", class: "10R1", password: "Qz9!k4H#v2Ln" },
  { name: "Thomsen, Bjarne", class: "10R1", password: "Tm8@n5J*b3Kx" },
  { name: "Zworski, Moritz Finn", class: "10R1", password: "Fp5!d9X#r2Bt" },
  { name: "Amini, Tamim", class: "10H", password: "Vz9!t4M#x7Pk" },
  { name: "Azimi, Arezo", class: "10H", password: "Hb3@s6G*y2Nd" },
  { name: "Bektasevic, Maida", class: "10H", password: "Jp5!d9W#r4Lv" },
  { name: "Efremidis, Alexis", class: "10H", password: "Qx2@t7M*b8Pz" },
  { name: "Finger, Joyce", class: "10H", password: "Sn4!k9H#v3Gr" },
  { name: "Lebjedzinski, Sophie", class: "10H", password: "Ck2!w8V#m5Nq" },
  { name: "Leikind, Diana", class: "10H", password: "Tz9@p4K*x2Mb" },
  { name: "Mehmedov, Mert", class: "10H", password: "Fv7!n8P#q3Jz" },
  { name: "Mhafel, Adel", class: "10H", password: "Lx4@t5G*b9Nd" },
  { name: "Notthoff, Nijsen", class: "10H", password: "Bv9!f2S#r7Mk" },
  { name: "Notthoff, Nick", class: "10H", password: "Dq3@n8H*v5Px" },
  { name: "Özer, Kartal", class: "10H", password: "Gn7!p4M#k2Tr" },
  { name: "Philipper, Niklas", class: "10H", password: "Hj9@t3V*x8Pn" },
  { name: "Pörtner, Tim Niklas", class: "10H", password: "Kb5!d9S#m2Jv" },
  { name: "Pollack, Kimberly", class: "10H", password: "Nx8@t4P*b3Gy" },
  { name: "Teimori, Asal", class: "10H", password: "Qz2!k9H#v7Lr" },
  { name: "Topper, Jannik", class: "10H", password: "Rb9@n5J*k4Tx" },
  { name: "Vogel, Niklas", class: "10H", password: "Sd4!f7X#m2Bp" },
  { name: "Wirsum, Maxim", class: "10H", password: "Tv8@p3M*w5Nr" },
];

async function main() {
  console.log("Seeding database...");

  const existingRooms = await db.select().from(rooms);
  if (existingRooms.length === 0) {
    await db.insert(rooms).values([
      { name: "Mathe", teacher: "Haenicke", capacity: 25 },
      { name: "Deutsch", teacher: "Hofer", capacity: 25 },
      { name: "Englisch", teacher: "Wischinski", capacity: 25 },
    ]);
    console.log("Rooms seeded.");
  } else {
    console.log("Rooms already exist, skipping.");
  }

  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    for (const t of teachers) {
      await db.insert(users).values({ username: t.name, password: t.password, role: "admin", className: "Lehrer" });
    }
    for (const s of students) {
      await db.insert(users).values({ username: s.name, password: s.password, role: "student", className: s.class });
    }
    console.log(`Seeded ${teachers.length} teachers and ${students.length} students.`);
  } else {
    console.log(`Users already exist (${existingUsers.length}), skipping.`);
  }

  await pool.end();
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
