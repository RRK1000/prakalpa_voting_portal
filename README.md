# Prakalpa Voting Portal - DBMS Project

This repo is maintained for hosting project files subject to evaluation. 
Team Number: 16

## Team Members:
Section 4G
1.  Aniket Kaulavkar PES1201700095
2.  Rishi Ravikumar PES1201700754
3.  Vishnu S Murali PES1201701264


# Execution Steps

## Front-end server
Run a python http server by executing the following command in the `/frontend/` directory. \
``` python3 -m http.server ```

## Firebase cli installation
``` yarn global add firebase-tools ```

## Back-end server
To install dependencies, run the following command in the `/backend/functions/` directory. \
``` yarn ```

Run `firebase-login` to login to firebase inside the `/backend/` directory.

To run server locally, type the following command in the `/backend/` directory. \
``` firebase serve --only functions ```

To deploy cloud functions, type the following command in the `/backend/` directory. \
``` firebase serve --only functions ```

### Note
    Make sure a working internet connection exists.

## User requirements
- The people who are a part of the voting application are categorized into admin, participants, students, and voters.

- The admin is controls and manages the application.Each admin has a unique id (a_d), a name (a_name) and an email address (a_email). The admin can add teams, view the live count of votes, and verifies teams. He also manages the event volunteers.

- Users hold just 3 attributes, a unique id(usn), a name(u_name) and an email(u_email). A user can either be a volunteer, a participant, or a voter.

- The volunteers are responsible for scanning students’ ID cards, that marks the students’ presence in the event. 

- Attendance consists of a unique id attribute(a_id), an android ID that identifies a volunteer’s registered phone(androidId), the volunteers unique ID(usn), and a lastModifiedAt attribute that saves the last scanned data entry from a volunteer.

- RegisteredPhones hold the necessary details of volunteers’ phones, and makes those volunteers eligible to scan the ID cards. It holds a unique id(r_id), the volunteers’ android ID(androidId), an isVerified attribute that is set by the admin. And a registeredAt attribute that holds a timestamp of the time the phone was registered.

- Teams has a unique id (t_id), a team name(t_name), a description(team_description), a createdAt attribute that is a timestamp for when the team was created, an. Additionally, it holds a photoUrl that would help voters identify the project that they would want to vote for.

- For the votes to be recorded, ratings has a unique id(rating_id), the voter’s unique ID(usn), and the ids of the teams the voter has voted for(t_id).

- For the user authentication, nonce and sessions are used. Nonce has 3 attributes, count, nonce and a timestamp. Sessions contains a unique id(s_id) a timestamp, and a token. The valid token that ensures secure usage contains the nonce, a payload through which the information is securely sent and received, and a signature. 

After the completion of the event, the admin can update the results, and release it to the students and announce the prize winners.

## ER Diagram
![ER Diagram.png](https://imgur.com/zWN7o4r.png)

## Relational Schema
![Relational Schema .png](https://i.imgur.com/PPxdLXu.png)
