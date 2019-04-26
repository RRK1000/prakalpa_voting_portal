select name, count(*) from votes right outer join teams on teams.id=votes.team_id group by teams.name order by count(*) desc;


create role admin;
CREATE VIEW RESULTS AS select name, count(*) from votes right outer join teams on teams.id=votes.team_id group by teams.name order by count(*) desc;
GRANT ALL ON RESULTS TO ADMIN;

select users.usn,name from votes,users where votes.usn = users.usn and users.usn in (select usn from attendance);

