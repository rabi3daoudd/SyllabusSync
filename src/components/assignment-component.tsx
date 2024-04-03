import { format } from "date-fns";
import { Card } from "./ui/card";

interface AssignmentComponentProps{
    index:number;
    name:string;
    day?:string;
    date?:Date;
    startingTime:string;
    finishingTime:string;
    location?:string;
    occurance:string;
}


const AssignmentComponent: React.FC<AssignmentComponentProps> = ({index,name,day,date, startingTime,finishingTime,location,occurance}) => {
    return(
            <Card>
                <div className="bg-[#FFFFFF] rounded-lg p-4 overflow-x-auto">
                    <h3 className="font-semibold mb-2 text-left">{name}</h3>
                    {day && <p className="text-sm">{day}</p>}
                    {date && <p className="text-sm">{`${format(date, 'MMM do yyyy')}`}</p>}
                    <p className="text-sm">{startingTime} - {finishingTime}</p>
                    {location && <p className="text-sm">{location}</p>}
                    {occurance === "OnceAWeek" && <p className="text-sm">Every week</p>}
                    {occurance === "OnceEveryTwoWeeks" && <p className="text-sm">Every two weeks</p>}
                </div>
            </Card>

    );
}

export default AssignmentComponent;