function getMonthName(dateStr) {
  const date = new Date(dateStr);
  const monthName = date.toLocaleString("en-US", { month: "long" });
  return monthName;
}

exports = { getMonthName };
