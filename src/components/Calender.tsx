import React from 'react';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hoursOfDay = [...Array(24).keys()].map(hour => `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`);

// Mock data for the study sessions, replace this with your actual event data
const studySessions = [
  { day: 1, startHour: 9, durationHours: 2 },
  { day: 3, startHour: 14, durationHours: 3 },
  { day: 5, startHour: 18, durationHours: 1 },
  // Add more sessions as needed
];

const Calendar: React.FC = () => {
  return (
    <div className="flex flex-col font-sans">
      <h1 className="text-xl font-bold p-4 text-left">Calendar</h1>
      <div className="flex divide-x divide-gray-300">
        <div className="w-16 bg-gray-100 p-2 text-center border-b border-gray-300">GMT+4</div>
        {daysOfWeek.map((day, index) => (
          <div key={index} className="flex-1 p-2 text-center border-b border-gray-300">
            {day}
          </div>
        ))}
      </div>
      <div className="flex grow">
        <div className="bg-gray-100">
          {hoursOfDay.map((hour, index) => (
            <div key={index} className="w-16 p-2 text-center border-b border-gray-300">{hour}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 divide-x divide-gray-300">
          {daysOfWeek.map((_, dayIndex) => (
            <React.Fragment key={dayIndex}>
              {hoursOfDay.map((_hour, hourIndex) => {
                // Check if there is a study session for this day and hour
                const session = studySessions.find(
                  session => session.day === dayIndex && session.startHour === hourIndex
                );
                const sessionStyle = session
                  ? {
                      gridColumn: 'span 1',
                      gridRowStart: session.startHour + 1, // +1 since CSS grid rows start at 1
                      gridRowEnd: `span ${session.durationHours}`,
                      backgroundColor: '#60a5fa',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }
                  : {};
                return (
                  <div
                    key={hourIndex}
                    className={`border-b border-gray-300 ${session ? 'relative' : ''}`}
                    style={sessionStyle}
                  >
                    {session && <span>Study Session</span>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
