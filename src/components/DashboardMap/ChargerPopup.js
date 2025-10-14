import { Box, Button, Chip, TextField, Typography, Switch } from '@mui/material';
import React, { Fragment, useEffect, useState } from 'react'
import { CurrencyRupee } from '@mui/icons-material';
import { Popup } from 'react-leaflet';
import { styled } from '@mui/material/styles';
import { addComplaint, decimalToBinary, fullChargeCost, updateBookedCharger, getORUpdateTimeSlotOFCharger } from '../../utils/auth/user';
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { STATUS_CHARGING_COMPLETED } from '../../constants';
import { SlArrowLeft } from "react-icons/sl";
import RatingFormPopup from './RatingFormPopup';


const MaterialUISwitch = styled(Switch)(({ theme }) => ({
    width: 60,
    height: 30,
    padding: 7,
    '& .MuiSwitch-switchBase': {
        margin: 1,
        padding: 0,
        transform: 'translateX(6px)',
        '&.Mui-checked': {
            color: '#fff',
            transform: 'translateX(28px)',
            '& .MuiSwitch-thumb:before': {
                content: '"AM"',
                margin: '5px',
                left: -1.2
            },
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
            },
        },
    },
    '& .MuiSwitch-thumb': {
        backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
        width: 29,
        height: 29,
        '&:before': {
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            content: '"PM"',
            margin: '5px',
        },
    },
    '& .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
        borderRadius: 20 / 2,
    },
}));

function CircularProgressWithLabel(props) {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" {...props} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(props.value)}%`}
                </Typography>
            </Box>
        </Box>
    );
}

export default function ChargerPopup({ chargerData, bookingHandler, user, userCurrentBookingGoingOn, tempValue }) {

    const navigate = useNavigate();

    const [showSlot, setShowSlot] = useState(false);
    const [start, setStart] = useState(null);
    const [complaintBox, setComplaintBox] = useState(false);
    const [AMPM, setAMPM] = useState(new Date().getHours() > 12 ? 'PM' : 'AM');
    const [progress, setProgress] = useState(0);
    const [stopInterval, setStopInterval] = useState(false);
    // const [showReview, setShowReview] = useState(false);
    const [openReview, setOpenReview] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [description, setDescription] = useState('');
    const [pictures, setPictures] = useState([{
        data: [],
        url: ""
    }]);

    const timing = [
        '12:00-1:00', '1:00-2:00', '2:00-3:00',
        '3:00-4:00', '4:00-5:00', '5:00-6:00', '6:00-7:00',
        '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00',
        '11:00-12:00'
    ];

    const openDialog = (e) => {
        e.preventDefault();
        setComplaintBox(true);
        setShowSlot(false);
    };

    useEffect(() => {
        const handleClickOut = (event) => {
            if (anchorEl && !anchorEl.contains(event.target)) {
                setAnchorEl(null);
            }
        };

        document.body.addEventListener('click', handleClickOut);

        return () => {
            document.body.removeEventListener('click', handleClickOut);
        };
    }, [anchorEl]);


    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);


    const handleDescriptionChange = (event) => setDescription(event.target.value);

    const handleOpenReview = () => setOpenReview(true);


    const handleImageChange = (event) => {
        const files = event.target.files;
        const newPictures = [...pictures];

        if (files) {
            if (pictures.length === 0) {
                const file = files[0];
                newPictures.push({
                    data: file,
                    url: URL.createObjectURL(file)
                });
            } else {
                [...files].forEach(file => {
                    newPictures.push({
                        data: file,
                        url: URL.createObjectURL(file)
                    });
                });
            }

            setPictures(newPictures);
            console.log("Selected images:", newPictures);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!description.trim()) {
            toast.error("Please provide a description for the complaint.");
            return;
        }
        if (pictures.length === 0) {
            toast.error("Please attach at least one image for the complaint");
            return;
        }

        const complaintData = {
            userId: user.uid,
            providerId: chargerData.uid,
            description: description,
            images: pictures.map(picture => picture.data)
        };
        addComplaint(chargerData.chargerId, complaintData);

        setDescription('');
        setPictures([]);

        toast.success("Complaint submitted successfully");
        setComplaintBox(false);
        setShowSlot(false);
    };

    const checkDisabled = (time) => {
        let binaryTime = decimalToBinary(chargerData.timeSlot);
        console.log(binaryTime);
        binaryTime = binaryTime.split("").reverse().join("");
        console.log(binaryTime);

        let intTime = parseInt(time.split('-')[0]);

        if (AMPM === 'PM' && intTime === 12) {
            intTime = 12;
        } else if (AMPM === 'AM' && intTime === 12) {
            intTime = 0;
        }
        else if (AMPM === 'PM' && intTime !== 12) {
            intTime += 12;
        }

        let start = chargerData.info.start;
        let end = chargerData.info.end;

        if(intTime <start || intTime>=end){
            console.log("inttime",intTime);
            console.log("start",start);
            console.log("end",end);
            return {disable: true, booked: false};
        }

        for (let i = 0; i < 24; i++) {
            if (binaryTime[i] === '1' && i === intTime) {
                return { disable: true, booked: true };
            }
        }
       
        return { disable: false, booked: false };
    };

    const timeSlotHandler = (e) => {
        const time = e.target.innerText.split('-');
        if (start === (parseInt(time[1]) - 1) + " " + AMPM) {
            setStart(null);
        } else {
            setStart((parseInt(time[1]) - 1) + " " + AMPM);
        }
    };

    const chargingSuccessfullyCompleted = () => {
        updateBookedCharger(userCurrentBookingGoingOn.id, STATUS_CHARGING_COMPLETED);

        const unSetDesiredBit = 1 << userCurrentBookingGoingOn.timeSlot;
        const newTiming = unSetDesiredBit ^ chargerData.timeSlot;
        getORUpdateTimeSlotOFCharger(chargerData.chargerId, newTiming);

        toast.success('Charging Completed Successfully!');
        setStopInterval(true);
        handleOpenReview();
        return;
    };
    
    // Progress Bar
    useEffect(() => {
        console.log(userCurrentBookingGoingOn?.timeSlot);
        const timer = setInterval(() => {
            if (!stopInterval) {
                setProgress(() => (new Date().getHours() === userCurrentBookingGoingOn?.timeSlot + 1 ? chargingSuccessfullyCompleted()
                    : new Date().getMinutes() > 30 ? new Date().getMinutes() + 40 : new Date().getMinutes()));
            }
        }, 1000);
        return () => {
            clearInterval(timer);
        };
        // eslint-disable-next-line 
    }, [stopInterval, userCurrentBookingGoingOn]);

    return (
        <Popup>
            <Box>
                {
                    (!showSlot && !complaintBox) ? (
                        <Fragment>
                            <Box sx={{ position: 'absolute', top: '0rem', right: '0rem' }}>
                                <IconButton
                                    type="button"
                                    variant="contained"
                                    onClick={handleClick}
                                    sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <MoreVertIcon sx={{ transform: 'rotate(90deg)' }} />
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
                                        <MenuItem onClick={openDialog}>
                                            Report this
                                        </MenuItem>
                                    </Menu>
                                </IconButton>
                            </Box>

                            <Box component='img' sx={{ position: 'relative', height: '8rem', width: "100%", borderRadius: '12px', marginLeft: '0rem', display: 'flex', justifyContent: 'center', alignItems: 'center', top: '1.5rem !important' }} alt='Charging Station' src={chargerData.info.imageUrl[0]}></Box>
                            <br /><br />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: 18, fontWeight: 'bold', color: '#454242', margin: '0px !important', marginTop: '0.8px !important' }}>{chargerData.info.stationName}</Typography>
                                {chargerData.info.status === 1 ? <Chip label="Available" color="success" size="small" variant="contained" sx={{ marginTop: "0.2rem" }} />
                                    : <Chip label="Not Available" color="error" size="small" variant="contained" sx={{ marginTop: "0.2rem" }} />}
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: '16px', color: '#797575', fontWeight: 'bold', margin: '0px !important', marginTop: '0.5px !important' }}>{chargerData.info.address}</Typography>

                            </Box>

                            <Box sx={{ display: 'flex' }}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex' }}>
                                            <Typography sx={{ fontSize: '.80rem', margin: '0px !important' }}>Type:{'\u00A0\u00A0'}</Typography>
                                            <Typography sx={{ fontSize: '.80rem', fontWeight: 'bold', margin: '0px !important' }}>{chargerData.info.chargerType}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex' }}>
                                        <Typography sx={{ fontSize: '.75rem', margin: '0px !important' }}>Timing:  {'\u00A0\u00A0'}</Typography>
                                        <Typography sx={{ fontSize: '.75rem', margin: '0px !important', fontWeight: 'bold' }}>{chargerData.info.start > 12 ? parseInt(chargerData.info.start) - 12 : chargerData.info.start}:00 {chargerData.info.start > 12 ? "PM" : "AM"} - {chargerData.info.end > 12 ? parseInt(chargerData.info.end) - 12 : chargerData.info.end}:00 {chargerData.info.end > 12 ? "PM" : "AM"}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex' }} >
                                        <Typography sx={{ fontSize: '0.80rem', margin: '0px !important' }}>Price for full charge: {' '}</Typography>
                                        <CurrencyRupee sx={{ height: '15px', width: '15px', marginTop: '4px', }} />
                                        <Typography sx={{ fontSize: 16, margin: '0px !important', fontWeight: 'bold' }}>
                                            {fullChargeCost(chargerData.info.chargerType, chargerData.info.state)}
                                        </Typography>
                                    </Box>
                                    {
                                        chargerData.info.status === 1 &&
                                        <Typography sx={{ fontSize: '0.80rem', margin: '0px !important' }}>*{tempValue} Available slots</Typography>
                                    }
                                </Box>

                                <Box sx={{ display: 'flex', marginLeft: '3rem' }}>
                                    {
                                        chargerData.info.status === 1 &&
                                        userCurrentBookingGoingOn?.timeSlot === new Date().getHours() &&
                                        <CircularProgressWithLabel value={progress} color="success" size={70} />
                                    }
                                    {
                                        openReview && (
                                            <RatingFormPopup open={openReview} setOpen={setOpenReview} user={user} chargerData={chargerData} />
                                        )
                                    }
                                </Box>
                            </Box>

                        </Fragment>
                    )
                        :
                        (
                            complaintBox ? (
                                <Fragment>
                                    <Box sx={{ display: 'flex' }}>
                                        <IconButton onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSlot(false);
                                            setComplaintBox(false);
                                        }} aria-label="Back" size="small">
                                            <SlArrowLeft fontSize="small" />
                                        </IconButton>
                                        <Typography sx={{ fontWeight: 'bold', marginLeft: '2.5rem!important' }}>Report this charger</Typography>
                                    </Box>
                                    <form onSubmit={handleSubmit}>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="Description"
                                            multiline
                                            rows={4}
                                            value={description}
                                            onChange={handleDescriptionChange}
                                            required
                                        />
                                        <br />
                                        <input type="file" accept="image/*" onChange={handleImageChange} multiple={pictures.length < 1} />
                                        <br />
                                    </form>
                                </Fragment>
                            ) : (
                                <Fragment>
                                    <Box sx={{ display: 'flex' }}>
                                        <IconButton onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSlot(false);
                                            setComplaintBox(false);
                                        }} aria-label="Back" size="small">
                                            <SlArrowLeft fontSize="small" />
                                        </IconButton>
                                        <Typography sx={{ fontWeight: 'bold', marginLeft: '2.5rem!important' }}>Select Charging Slot</Typography>
                                    </Box>

                                    <MaterialUISwitch sx={{ mb: 1 }} defaultChecked={(new Date().getHours()) > 12 ? false : true} onChange={(e) => {
                                        e.target.checked ? setAMPM('AM') : setAMPM('PM');
                                    }} />


                                    <Box sx={{ display: 'grid', gridTemplateColumns: '5.5rem 5.5rem 5.5rem', gridGap: '7px', marginBottom: '2rem' }}>
                                        {
                                            timing.map((time, idx) => {
                                                const { disable, booked } = checkDisabled(time);

                                                return <Chip key={idx} size='small' onClick={(e) => timeSlotHandler(e)}
                                                    disabled={disable} color={start === idx + " " + AMPM ? "success" : booked ? "primary" : "default"} label={time} variant={(start === idx + " " + AMPM) || (booked) ? "filled" : "outlined"} />
                                            })
                                        }
                                    </Box>
                                </Fragment>

                            )
                        )

                }
                {
                    chargerData.info.status === 1 &&
                    <Box sx={{ display: 'flex', justifyContent: 'end', marginTop: 1 }}>
                        <Button type='button' onClick={(e) => {

                            if (showSlot) {
                                if (!user.level2) {
                                    navigate('/register/level1');
                                    return;
                                }
                                if (start === null) {
                                    toast.error('Please select a slot');
                                    return;
                                }
                                bookingHandler(start.split(" ")[0] === 0 ? 12 : start.split(" ")[0], AMPM, chargerData);
                                setShowSlot(false);
                                setStart(null);
                                toast.success('Booking Request Successful');
                            } else {
                                if (complaintBox) {
                                    handleSubmit(e);
                                    setComplaintBox(false);
                                    setShowSlot(false);
                                }
                                else {
                                    setShowSlot(true);
                                    setComplaintBox(false);
                                }

                            }
                        }
                        } variant="contained" sx={{
                            height: '2rem', width: '20rem',
                            backgroundColor: '#FCDD13', color: '#000000', fontSize: '13px', fontFamily: 'Manrope !important',
                            textTransform: 'capitalize', fontWeight: 'bold', borderRadius: '20px', padding: '0px 10px'
                        }}>{showSlot ? "Book now" : (complaintBox ? "Submit" : "Select Charging Slot")}</Button>
                    </Box>
                }
            </Box>
        </Popup>
    )
}