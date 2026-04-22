// fetch-careers-csv.ts

const SPREADSHEET_ID = "1hZGl7nRKstVKCmEJQh3EJf-_D24BJQSNiO_DdGktoz0";
const CAREERS_GID = "255949518";

export async function fetchCareersCsv(): Promise<string> {
  const csv_url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${CAREERS_GID}`;

  const response = await fetch(csv_url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("careers の CSV 取得に失敗した");
  }

  const csv_text = await response.text();

  return csv_text;
}
