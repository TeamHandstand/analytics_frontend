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
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { defaultTheme } from "./defaultTheme";
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
  const [teams, setTeams] = React.useState([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmissionLoading, setIsSubmissionLoading] = React.useState(false);
  const [isMatchupLoading, setIsMatchupLoading] = React.useState(false);
  const [isTeamLoading, setIsTeamLoading] = React.useState(false);
  const [isUrlLoading, setIsUrlLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [mediaUrl, setMediaUrl] = React.useState("");
  const theme = createMuiTheme(defaultTheme);

  const useStyles = makeStyles({
    container: {
      backgroundColor: "black",
      height: "100%",
      width: "100%"
    },
    paper: {
      padding: "16px"
    },
    header: {
      display: "flex",
      alignContent: "center",
      marginBottom: "8px"
    },
    overview: {
      display: "flex",
      justifyContent: "space-evenly"
    },
    submissionHeader: {
      display: "flex",
      justifyContent: "space-between"
    },
    table: {},
    badgeInfo: {
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "18%",
      padding: "4px"
    },
    selectedBadge: {
      backgroundColor: "pink"
    },
    icon: {
      width: "40px",
      height: "auto"
    },
    textContainer: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%"
    },
    teamImage: {
      width: "30px",
      height: "auto"
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

  const fetchDataForEventId = () => {
    const url = `https://api.handstandwith.us/v2/events/${eventId}/event_badges`;
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
              name: badge.name,
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
              const total =
                json.submissions.reduce(
                  (acc, c) => acc + c.numScoredMatchups,
                  0
                ) / 2;

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
        setBadgeRiddles(mappedBadges.filter(badge => badge !== undefined));
        setIsLoading(false);
      })
      .catch(error => {
        console.log("ERROR FETCHING BADGE DATA: ", error);
        setIsLoading(false);
      });
  };

  const handleEventIdButtonClick = () => {
    setSelectedRiddleId("");
    fetchTeamInfoForEventId();
    fetchDataForEventId();
  };

  const handleBadgeClick = riddleId => {
    setSelectedRiddleId(riddleId);
    fetchMatchupsForRiddleId(riddleId);
    // checkAllUrls();
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
        setIsMatchupLoading(false);
        setBadgeRiddles(mappedBadges.filter(badge => badge !== undefined));
      })
      .catch(err => {
        setIsMatchupLoading(false);
        console.log("Error fetching matchup data:", err);
      });
  };

  const fetchTeamInfoForEventId = () => {
    setIsTeamLoading(true);
    const url = `https://api.handstandwith.us/v2/events/${eventId}/teams`;
    setIsMatchupLoading(true);
    fetch(proxyUrl + url, {
      headers
    })
      .then(res => res.json())
      .then(json => {
        setTeams(json.teams);
        setIsTeamLoading(false);
      })
      .catch(err => {
        setIsTeamLoading(false);
        console.log("Error fetching team data:", err);
      });
  };

  const handleRefreshClick = () => {
    handleEventIdButtonClick();
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

  const checkUrl = url => {
    var http = new XMLHttpRequest();

    http.open("HEAD", url, false);
    http.send();

    return http.status != 404 && http.status != 403;
  };

  const checkAllUrls = () => {
    setIsUrlLoading(true);
    let mappedBadgeRiddles = badgeRiddles.map(br => {
      let mappedSubmissions = br.submissions.map(sub => {
        const isVideoReachable = checkUrl(sub.solvedRiddle.mediaUrl);
        return {
          ...sub,
          isVideoReachable
        };
      });
      return {
        ...br,
        submissions: mappedSubmissions
      };
    });
    setBadgeRiddles(mappedBadgeRiddles);
    setIsUrlLoading(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.container}>
        <Paper className={classes.paper}>
          <Grid container>
            <Grid item xs={12} className={classes.header}>
              <TextField
                variant="outlined"
                onChange={handleEventIdChange}
                onKeyDown={handleKeyDown}
                value={eventId}
                label={"Event ID or Slug"}
              />
              <Button variant="outlined" onClick={handleEventIdButtonClick}>
                {isLoading ? <CircularProgress size={20} /> : "Go"}
              </Button>
              <Button variant="outlined" onClick={handleRefreshClick}>
                {isLoading ? <CircularProgress size={20} /> : "Refresh"}
              </Button>
            </Grid>
            {!isLoading && (
              <Grid item xs={12}>
                <Grid container className={classes.overview}>
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
                        <img className={classes.icon} src={br.image} />
                        <Typography>{br.name}</Typography>
                        <div className={classes.textContainer}>
                          <Typography># Subs: </Typography>
                          {isSubmissionLoading ? (
                            <CircularProgress size={10} />
                          ) : (
                            <Typography>{br.submissionTotal}</Typography>
                          )}
                        </div>
                        <div className={classes.textContainer}>
                          <Typography># Votes: </Typography>
                          {isSubmissionLoading ? (
                            <CircularProgress size={10} />
                          ) : (
                            <Typography>{br.voteTotal}</Typography>
                          )}
                        </div>
                        <div className={classes.textContainer}>
                          <Typography>Avg Matchup: </Typography>
                          {isSubmissionLoading ? (
                            <CircularProgress size={10} />
                          ) : (
                            <Typography>{br.averageNumMatchups}</Typography>
                          )}
                        </div>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            )}
            {!isLoading && badgeRiddles.length > 0 && selectedRiddleId && (
              <Grid container>
                <Grid item xs={12} className={classes.submissionHeader}>
                  <Typography variant={"h4"}>Submissions</Typography>
                </Grid>
                <Grid item xs={12} className={classes.table}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ranking</TableCell>
                        <TableCell>Team Name</TableCell>
                        <TableCell>Team Image</TableCell>
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
                                {teams?.find(
                                  team =>
                                    team.id === submission.solvedRiddle.teamId
                                )?.name || "<Team Deleted>"}
                              </TableCell>
                              <TableCell>
                                <img
                                  className={classes.teamImage}
                                  src={
                                    teams?.find(
                                      team =>
                                        team.id ===
                                        submission.solvedRiddle.teamId
                                    )?.imageUrl
                                  }
                                />
                              </TableCell>
                              <TableCell>{submission.eloScore}</TableCell>
                              <TableCell>
                                {/* {isUrlLoading ? (
                                  <CircularProgress size={10} />
                                ) : submission.isVideoReachable ? (
                                  <IconButton
                                    onClick={() => {
                                      handlePlayIconClick(
                                        submission.solvedRiddle.mediaUrl
                                      );
                                    }}
                                  >
                                    <PlayCircleOutlineIcon />
                                  </IconButton>
                                ) : (
                                  "X"
                                )} */}
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
    </ThemeProvider>
  );
}

export default App;
