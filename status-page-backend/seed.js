require('dotenv').config();
const mongoose = require("mongoose");
const Service = require("./models/Service");
const ServiceGroup = require("./models/ServiceGroup");
const User = require("./models/User");
const Maintenance = require("./models/Maintenance");

const users = require('./data/users.json');

const maintenanceData = require('./data/maintenance.json');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedDatabase() {
  try {

    // const servicesDocs = [];
    // for (const group of servicesData) {
    //   const serviceDocs = await Service.insertMany(group.services);
    //   servicesDocs.push(...serviceDocs);
    //   console.log(`${group.name} services inserted`);
    // }
    // const serviceGroupsDocs = servicesData.map(group => {
    //   return {
    //     name: group.name,
    //     services: group.services.map(service => {
    //       const serviceDoc = servicesDocs.find(s => s.name === service.name);
    //       return serviceDoc ? serviceDoc._id : null;
    //     }).filter(id => id)
    //   };
    // });

    // await ServiceGroup.insertMany(serviceGroupsDocs);
    // console.log("Service Groups inserted");
    await User.insertMany(users);

    // Insert the maintenance data into the database
    // await Maintenance.insertMany(maintenanceData);

    // console.log("Maintenance data successfully added to the database.");
    // mongoose.connection.close();
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

seedDatabase();

// require('dotenv').config();
// const mongoose = require("mongoose");
// const Incident = require("./models/Incident");  // Ensure the path is correct
// const User = require("./models/User");  // Ensure the path is correct

// const incidentsData = [
//   {
//       "type": "Incident",
//       "title": "API Latency Issues",
//       "description": "Users are experiencing high response times when accessing the API.",
//       "status": "Investigating",
//       "affected_services": [],
//       "occurred_at": "2025-02-01T08:30:00Z",
//       "updated_at": "2025-02-01T09:15:00Z",
//       "reported_by": "user_api_database",  // This is the username, will be replaced with ObjectId
//       "timeline": [
//           {
//               "status": "Reported",
//               "timestamp": "2025-02-01T08:00:00Z",
//               "content": "Users have reported slow response times when making API requests, affecting various endpoints."
//           },
//           {
//               "status": "Investigating",
//               "timestamp": "2025-02-01T08:30:00Z",
//               "content": "The engineering team is investigating the root cause of the API latency. Initial assessments suggest possible database query inefficiencies."
//           }
//       ]
//   },
//   {
//       "type": "Incident",
//       "title": "Website Downtime",
//       "description": "Users are unable to access the website due to a server crash.",
//       "status": "Reported",
//       "affected_services": [],
//       "occurred_at": "2025-02-01T07:45:00Z",
//       "updated_at": "2025-02-01T07:45:00Z",
//       "reported_by": "user_website",  // This is the username, will be replaced with ObjectId
//       "timeline": [
//           {
//               "status": "Reported",
//               "timestamp": "2025-02-01T07:45:00Z",
//               "content": "Multiple users reported being unable to load the website, receiving a '503 Service Unavailable' error. Our team is assessing the issue."
//           }
//       ]
//   },
//   {
//       "type": "Incident",
//       "title": "CDN Performance Degradation",
//       "description": "Some users are experiencing slow content delivery due to CDN issues.",
//       "status": "Monitoring",
//       "affected_services": [],
//       "occurred_at": "2025-01-31T18:45:00Z",
//       "updated_at": "2025-02-01T01:00:00Z",
//       "reported_by": "user_cdn",  // This is the username, will be replaced with ObjectId
//       "timeline": [
//           {
//               "status": "Reported",
//               "timestamp": "2025-01-31T18:00:00Z",
//               "content": "Users reported slow loading times for assets and images due to CDN delays."
//           },
//           {
//               "status": "Investigating",
//               "timestamp": "2025-01-31T18:45:00Z",
//               "content": "Our network team is investigating potential latency issues in the CDN service."
//           },
//           {
//               "status": "Identified",
//               "timestamp": "2025-01-31T20:00:00Z",
//               "content": "The issue has been identified as a regional network congestion problem affecting CDN traffic."
//           },
//           {
//               "status": "Monitoring",
//               "timestamp": "2025-02-01T01:00:00Z",
//               "content": "Mitigation measures have been applied, and performance is improving. The team is monitoring for further anomalies."
//           }
//       ]
//   },
//   {
//       "type": "Incident",
//       "title": "Email Notifications Outage",
//       "description": "Emails are not being delivered due to an issue with the email service provider.",
//       "status": "Fixed",
//       "affected_services": [],
//       "occurred_at": "2025-01-30T12:10:00Z",
//       "updated_at": "2025-01-30T15:30:00Z",
//       "reported_by": "user_email_notifications",  // This is the username, will be replaced with ObjectId
//       "timeline": [
//           {
//               "status": "Reported",
//               "timestamp": "2025-01-30T11:45:00Z",
//               "content": "Users reported that they are not receiving email notifications for password resets and account verifications."
//           },
//           {
//               "status": "Investigating",
//               "timestamp": "2025-01-30T12:10:00Z",
//               "content": "The engineering team is diagnosing the email delivery failures."
//           },
//           {
//               "status": "Identified",
//               "timestamp": "2025-01-30T13:00:00Z",
//               "content": "Issue traced to a misconfiguration in our email provider's API. A fix is being implemented."
//           },
//           {
//               "status": "Monitoring",
//               "timestamp": "2025-01-30T14:30:00Z",
//               "content": "Email delivery is restored. We are monitoring system performance."
//           },
//           {
//               "status": "Fixed",
//               "timestamp": "2025-01-30T15:30:00Z",
//               "content": "The email notification service is fully operational. Incident resolved."
//           }
//       ]
//   }
// ];

// mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/status_page_db", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// async function replaceReportedBy() {
//   try {
//     // Step 1: Fetch users based on usernames
//     const users = await User.find({
//       username: { $in: [
//         "user_api_database",
//         "user_website",
//         "user_cdn",
//         "user_email_notifications"
//       ]}
//     });

//     // Step 2: Map usernames to ObjectIds
//     const userMap = users.reduce((map, user) => {
//       map[user.username] = user._id;
//       return map;
//     }, {});

//     // Step 3: Replace reported_by with ObjectId
//     incidentsData.forEach(incident => {
//       incident.reported_by = userMap[incident.reported_by];
//     });


//     console.log(incidentsData)

//     // Step 4: Insert incidents into the database
//     await Incident.insertMany(incidentsData);
//     console.log("Incidents inserted with ObjectIds for reported_by.");

//     // Close the connection
//     mongoose.connection.close();
//   } catch (error) {
//     console.error("Error inserting incidents:", error);
//   }
// }

// replaceReportedBy();
