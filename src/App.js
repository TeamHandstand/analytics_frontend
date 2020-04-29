import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  TextField,
  Grid,
  Paper,
  Button,
  Typography,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  CircularProgress
} from "@material-ui/core";

function App() {
  const proxyUrl = "https://cors-anywhere.herokuapp.com/";
  const headers = {
    auth: "DrSilverstein"
  };
  const [eventId, setEventId] = React.useState("");
  const [selectedRiddleId, setSelectedRiddleId] = React.useState("");
  const [badgeRiddles, setBadgeRiddles] = React.useState([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmissionLoading, setIsSubmissionLoading] = React.useState(false);
  const [isMatchupLoading, setIsMatchupLoading] = React.useState(false);

  React.useEffect(() => {});
  const theme = useTheme();
  const useStyles = makeStyles({
    container: {
      backgroundColor: "black",
      height: "100%",
      width: "100%"
    },
    paper: {
      padding: "16px"
    },
    header: {},
    overview: {},
    submissionHeader: {},
    submissionOverview: {
      backgroundColor: "#EFEFEF"
    },
    table: {},
    badgeInfo: {},
    selectedBadge: {
      backgroundColor: "pink"
    }
  });
  const classes = useStyles();

  const handleEventIdChange = e => {
    setEventId(e.target.value);
  };

  const handleEventIdButtonClick = e => {
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const url = `https://api.staging.handstandwith.us/v2/events/${eventId}/event_badges`;
    setIsLoading(true);
    fetch(proxyUrl + url, {
      headers
    })
      .then(response => response.json())
      .then(json => {
        let mappedBadges = json.map(badge => {
          const votableRiddle = badge.eventRiddles.filter(
            er => er.isVotable
          )[0];
          if (votableRiddle) {
            return {
              image: badge.imageUrl,
              riddle: votableRiddle
            };
          }
        });

        for (const badge in mappedBadges) {
          const currentBadge = mappedBadges[badge];
          const submissionUrl = `https://api.staging.handstandwith.us/v2/events/${eventId}/event_riddles/${currentBadge.riddle.id}/submissions`;
          setIsSubmissionLoading(true);
          fetch(proxyUrl + submissionUrl, {
            headers
          })
            .then(res => res.json())
            .then(json => {
              const total = json.submissions.reduce(
                (acc, c) => acc + c.numScoredMatchups,
                0
              );

              const average = total / json.submissions.length;
              console.log("SUB", json.submissions, "Total", total);
              mappedBadges[badge] = {
                ...currentBadge,
                submissionTotal: json.submissions.length,
                averageNumMatchups: average,
                voteTotal: total
              };

              setBadgeRiddles(
                mappedBadges.filter(badge => badge !== undefined)
              );
              setIsSubmissionLoading(false);

              //   const matchupUrl = `https://api.staging.handstandwith.us/v2/events/${eventId}/event_riddles/${currentBadge.riddle.id}/matchups`;
              //   setIsMatchupLoading(true);
              //   fetch(proxyUrl + matchupUrl, {
              //     headers
              //   })
              //     .then(res => res.json())
              //     .then(json => {
              //       mappedBadges[badge] = {
              //         ...mappedBadges[badge],
              //         voteTotal: json.matchups.filter(
              //           m => !!m.winningSubmissionId
              //         ).length
              //       };
              //       setBadgeRiddles(
              //         mappedBadges.filter(badge => badge !== undefined)
              //       );
              //       setIsMatchupLoading(false);
              //     })
              //     .catch(err => {
              //       setIsMatchupLoading(false);
              //       console.log("Error fetching matchup data:", err);
              //     });
            })
            .catch(err => {
              setIsSubmissionLoading(false);
              console.log("Error fetching submission data:", err);
            });
        }

        console.log("BR", mappedBadges);
        setBadgeRiddles(mappedBadges.filter(badge => badge !== undefined));
        setIsLoading(false);

        // TODO: fix this. mapping is getting screwy in async world
        // setTimeout(() => {
        //   for (const badge in mappedBadges) {
        //     const currentBadge = mappedBadges[badge];

        //   }
        // }, 5000);
      })
      .catch(error => {
        console.log("ERROR FETCHING : ", error);
        setIsLoading(false);
      });
  };
  return (
    <div className={classes.container}>
      <Paper className={classes.paper}>
        <Grid container>
          <Grid item xs={12} className={classes.header}>
            <TextField
              variant="outlined"
              onChange={handleEventIdChange}
              value={eventId}
            />
            <Button
              type={"success"}
              variant="outlined"
              onClick={handleEventIdButtonClick}
            >
              Go
            </Button>
          </Grid>
          {!isLoading && (
            <Grid item xs={12} className={classes.overview}>
              <Grid container>
                {badgeRiddles.map(br => {
                  return (
                    <Grid
                      item
                      className={`${classes.badgeInfo} ${br?.riddle?.id ===
                        selectedRiddleId && classes.selectedBadge}`}
                      onClick={() => {
                        setSelectedRiddleId(br?.riddle?.id);
                      }}
                    >
                      <img src={br.image} />
                      <Typography>
                        # Sub:{" "}
                        {isSubmissionLoading ? (
                          <CircularProgress size={10} />
                        ) : (
                          br.submissionTotal
                        )}
                      </Typography>
                      <Typography>
                        # Votes:{" "}
                        {isSubmissionLoading ? (
                          <CircularProgress size={10} />
                        ) : (
                          br.voteTotal
                        )}
                      </Typography>
                      <Typography>
                        Avg Matchup:{" "}
                        {isSubmissionLoading ? (
                          <CircularProgress size={10} />
                        ) : (
                          br.averageNumMatchups
                        )}
                      </Typography>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          )}
          {isLoading && <CircularProgress />}
          {!isLoading && badgeRiddles.length > 0 && selectedRiddleId && (
            <Grid container>
              <Grid item xs={12} className={classes.submissionHeader}>
                <Typography>Submissions</Typography>
                <Button variant="outlined">Refresh</Button>
              </Grid>
              <Grid item xs={12} className={classes.submissionOverview}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Total Submissions</TableCell>
                      <TableCell>Total Votes</TableCell>
                      <TableCell>Avg Num Matchups</TableCell>
                      <TableCell>Num Undefeated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12} className={classes.table}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ranking</TableCell>
                      <TableCell>Team Name</TableCell>
                      <TableCell>Elo Rating</TableCell>
                      <TableCell>Media URL</TableCell>
                      <TableCell>Wins</TableCell>
                      <TableCell>Losses</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody></TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>
    </div>
  );
}

export default App;
