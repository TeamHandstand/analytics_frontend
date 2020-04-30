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
  CircularProgress,
  Modal,
  IconButton
} from "@material-ui/core";

import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";

function App() {
  const proxyUrl = "https://cors-anywhere.herokuapp.com/";
  const headers = {
    authToken: "67577065-4b78-494d-b1c7-4f2c92ef795d",
    userId: "635A39B5-8C7A-45FB-A44F-388354EB4890",
    mobile: "glevy11"
  };
  const [eventId, setEventId] = React.useState("");
  const [selectedRiddleId, setSelectedRiddleId] = React.useState("");
  const [badgeRiddles, setBadgeRiddles] = React.useState([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmissionLoading, setIsSubmissionLoading] = React.useState(false);
  const [isMatchupLoading, setIsMatchupLoading] = React.useState(false);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [mediaUrl, setMediaUrl] = React.useState("");
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
    submissionHeader: {
      display: "flex",
      justifyContent: "space-between"
    },
    submissionOverview: {
      backgroundColor: "#EFEFEF"
    },
    table: {},
    badgeInfo: {
      cursor: "pointer"
    },
    selectedBadge: {
      backgroundColor: "pink"
    },
    modal: {
      position: "absolute",
      width: "70vw",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: theme.palette.background.paper,
      border: "2px solid #000",
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }
  });
  const classes = useStyles();

  const handleEventIdChange = e => {
    setEventId(e.target.value);
  };

  const fetchDataForEventId = async () => {
    const url = `https://api.handstandwith.us/v2/events/${eventId}/event_badges`;
    setIsLoading(true);
    await fetch(proxyUrl + url, {
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
          const submissionUrl = `https://api.handstandwith.us/v2/events/${eventId}/event_riddles/${currentBadge.riddle.id}/submissions`;
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

              const average = (total / json.submissions.length).toFixed(1);
              mappedBadges[badge] = {
                ...currentBadge,
                submissions: json.submissions.sort((x, y) => {
                  const diff = y.eloScore - x.eloScore;
                  if (diff !== 0) {
                    return diff;
                  }
                  return y.numScoredMatchups - x.numScoredMatchups;
                }),
                submissionTotal: json.submissions.length,
                averageNumMatchups: average,
                voteTotal: total
              };

              setBadgeRiddles(
                mappedBadges.filter(badge => badge !== undefined)
              );
              setIsSubmissionLoading(false);
            })
            .catch(err => {
              setIsSubmissionLoading(false);
              console.log("Error fetching submission data:", err);
            });
        }

        console.log("BR", mappedBadges);
        setBadgeRiddles(mappedBadges.filter(badge => badge !== undefined));
        setIsLoading(false);
      })
      .catch(error => {
        console.log("ERROR FETCHING : ", error);
        setIsLoading(false);
      });
  };

  const handleEventIdButtonClick = e => {
    fetchDataForEventId();
  };

  const handleBadgeClick = riddleId => {
    setSelectedRiddleId(riddleId);
    fetchMatchupsForRiddleId(riddleId);
  };

  const fetchMatchupsForRiddleId = riddleId => {
    const matchupUrl = `https://api.handstandwith.us/v2/events/${eventId}/event_riddles/${riddleId}/matchups`;
    setIsMatchupLoading(true);
    fetch(proxyUrl + matchupUrl, {
      headers
    })
      .then(res => res.json())
      .then(json => {
        let mappedBadges = badgeRiddles.map(br => {
          let mappedSubmissions = br.submissions.map(sub => {
            const wins = json.matchups.filter(
              matchup => matchup.winningSubmissionId === sub.id
            ).length;
            const losses = json.matchups.filter(
              matchup =>
                matchup.winningSubmissionId !== sub.id &&
                matchup.winningSubmissionId !== null &&
                (matchup.submissionAId === sub.id ||
                  matchup.submissionBId === sub.id)
            ).length;
            return { ...sub, wins, losses };
          });
          return {
            ...br,
            submissions: mappedSubmissions
          };
        });
        setBadgeRiddles(mappedBadges.filter(badge => badge !== undefined));
        setIsMatchupLoading(false);
      })
      .catch(err => {
        setIsMatchupLoading(false);
        console.log("Error fetching matchup data:", err);
      });
  };

  const handleRefreshClick = async () => {
    await fetchDataForEventId(eventId);
    fetchMatchupsForRiddleId(selectedRiddleId);
  };

  const handlePlayIconClick = mediaUrl => {
    setMediaUrl(mediaUrl);
    setModalOpen(true);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      handleEventIdButtonClick();
    }
  };
  return (
    <div className={classes.container}>
      <Paper className={classes.paper}>
        <Grid container>
          <Grid item xs={12} className={classes.header}>
            <TextField
              variant="outlined"
              onChange={handleEventIdChange}
              onKeyDown={handleKeyDown}
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
                        handleBadgeClick(br?.riddle?.id);
                      }}
                    >
                      <img src={br.image} />
                      <Typography>
                        # Subs:{" "}
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
                <Typography variant={"h4"}>Submissions</Typography>
                <Button variant="outlined" onClick={handleRefreshClick}>
                  Refresh
                </Button>
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
                    {/* {badgeRiddles.find(br => br.riddle.id ===  selectedRiddleId)} */}
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
                  <TableBody>
                    {badgeRiddles
                      .find(br => br.riddle.id === selectedRiddleId)
                      ?.submissions?.map((submission, index) => {
                        return (
                          <TableRow>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {submission.solvedRiddle.teamId}
                            </TableCell>
                            <TableCell>{submission.eloScore}</TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => {
                                  handlePlayIconClick(
                                    submission.solvedRiddle.mediaUrl
                                  );
                                }}
                              >
                                <PlayCircleOutlineIcon />
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              {isMatchupLoading ? (
                                <CircularProgress size={10} />
                              ) : (
                                submission.wins
                              )}
                            </TableCell>
                            <TableCell>
                              {isMatchupLoading ? (
                                <CircularProgress size={10} />
                              ) : (
                                submission.losses
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
      >
        <div className={classes.modal}>
          <video controls src={mediaUrl} />
        </div>
      </Modal>
    </div>
  );
}

export default App;
