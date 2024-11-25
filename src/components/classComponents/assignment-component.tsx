import { format } from "date-fns";
import { Card } from "../ui/card";
import { PencilIcon, TrashIcon } from "lucide-react";

interface AssignmentComponentProps{
    index:number;
    name:string;
    day?:string;
    date?:Date;
    startingTime:string;
    finishingTime:string;
    location?:string;
    occurance:string;
    onEdit: () => void;
    onDelete: () => void;
}


const AssignmentComponent: React.FC<AssignmentComponentProps> = ({name,day,date, startingTime,finishingTime,location,occurance,onEdit,onDelete}) => {
    return(
            <Card>
                <div className="rounded-lg p-4 overflow-x-auto">
                    <h3 className="font-semibold mb-2 text-left">{name}</h3>
                    {day && <p className="text-sm">{day}</p>}
                    {date && <p className="text-sm">{`${format(date, 'MMM do yyyy')}`}</p>}
                    <p className="text-sm">{startingTime} - {finishingTime}</p>
                    {location && <p className="text-sm">{location}</p>}
                    {occurance === "OnceAWeek" && <p className="text-sm">Every week</p>}
                    {occurance === "OnceEveryTwoWeeks" && <p className="text-sm">Every two weeks</p>}
                    <div className="flex space-x-2 items-center ml-auto">
                        <PencilIcon className="w-5 h-5 cursor-pointer" onClick={onEdit} />
                        <TrashIcon className="w-5 h-5 cursor-pointer" onClick={onDelete} />
                    </div>
                </div>
            </Card>

    );
}

export default AssignmentComponent;