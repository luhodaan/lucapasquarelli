-- SQLite
SELECT subject, SUM(hours) AS total_hours 
FROM entries
group BY subject;