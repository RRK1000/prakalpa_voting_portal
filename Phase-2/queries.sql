select name,
       role
from users,
     votes
where users.usn = votes.usn
    and team_id = 'mlBCuTPgTqfraRhgqjrx';


select phone_id
from registered_phones
where isverified='t';


update registered_phones
set isVerified='f'
where phone_id = '866817034205930';


select name,
       count(*)
from votes,
     teams
where teams.id=votes.team_id
group by team_id,
         name
order by count(*) desc;


alter table teams
alter column name type varchar(200);


select u.usn,
       name
from users u,
     attendance a,
     votes v
where u.usn=a.usn
    and a.usn=v.usn;